'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserRole, User, AuthState } from '@/src/types/auth.types';
import { normalizeUserRole } from '@/src/types/auth.types';
import {
  getStoredAccessToken,
  hasRefreshSession,
  setHasRefreshSession,
  setStoredAccessToken,
  setRefreshHandler,
  AUTH_EXPIRED_EVENT,
} from '@/src/lib/api.client';
import {
  loginApi,
  getMeApi,
  logoutApi,
  refreshTokenApi,
  type UserProfileResponse,
} from '@/src/services/auth.service';

// ── Mock user data ──────────────────────────────────────────────────────────
const MOCK_ADMIN: User = {
  id: 'u-001',
  name: 'Alex Johnson',
  email: 'alex@ezchatbot.io',
  avatar: undefined,
  role: 'superadmin',
};

const MOCK_AGENT: User = {
  id: 'u-002',
  name: 'Sarah Agent',
  email: 'sarah@ezchatbot.io',
  avatar: undefined,
  role: 'agent',
  // These siteIds correspond to sites in sitesMockData.ts where assignedAgentIds includes 'u-002'
  sites: ['site-001', 'site-003', 'site-005'],
};

const ROLE_TO_USER: Record<UserRole, User> = {
  superadmin: MOCK_ADMIN,
  admin: { ...MOCK_ADMIN, role: 'admin' },
  agent: MOCK_AGENT,
};

// ── Context Shape ───────────────────────────────────────────────────────────
interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getTokenOrganizationId(): string | null {
  const token = getStoredAccessToken();
  const payload = token?.split('.')[1];
  if (!payload) return null;

  try {
    const normalized = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const data = JSON.parse(atob(normalized)) as { organizationId?: string | null };
    return data.organizationId ?? null;
  } catch {
    return null;
  }
}

// Map a backend profile to a frontend User. Returns null when the role is
// unknown/empty so the caller can reject the session rather than escalate.
function mapProfileToUser(profile: UserProfileResponse): User | null {
  const role = normalizeUserRole(profile.role);
  if (!role) return null;

  return {
    id: profile.id,
    name: profile.name || profile.fullName || profile.email.split('@')[0],
    email: profile.email,
    role,
    avatar: profile.avatarUrl || profile.avatar,
    organizationId: profile.organizationId ?? getTokenOrganizationId(),
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    currentRole: 'superadmin',
    isAuthenticated: false,
    isLoading: true,
  });

  // Single definitions for each session state transition. setAuthenticated
  // returns false for an unsupported role so callers can reject the session.
  const setAuthenticated = useCallback((profile: UserProfileResponse): boolean => {
    const user = mapProfileToUser(profile);
    if (!user) return false;
    setState({
      user,
      currentRole: user.role,
      isAuthenticated: true,
      isLoading: false,
    });
    return true;
  }, []);

  const setUnauthenticated = useCallback(() => {
    setState({
      user: null,
      currentRole: 'superadmin',
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  // Inject the refresh callback so apiRequest can refresh on a 401 without a
  // circular dependency on the auth service.
  useEffect(() => {
    setRefreshHandler(async () => {
      try {
        const { accessToken } = await refreshTokenApi();
        return accessToken;
      } catch {
        return null;
      }
    });
    return () => setRefreshHandler(null);
  }, []);

  // An unrecoverable session (refresh failed during a background request):
  // clear local auth state and force re-authentication. Skip the hard redirect
  // when already on /login to avoid a needless reload mid form entry.
  useEffect(() => {
    const handleAuthExpired = () => {
      setStoredAccessToken(null);
      setHasRefreshSession(false);
      setUnauthenticated();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [setUnauthenticated]);

  // Restore the session on mount. apiRequest self-heals an expired access
  // token (one refresh + retry); an unrecoverable refresh emits
  // AUTH_EXPIRED_EVENT, handled by the effect above.
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!getStoredAccessToken() && !hasRefreshSession()) {
        if (isMounted) setUnauthenticated();
        return;
      }
      try {
        const profile = await getMeApi();
        if (isMounted && !setAuthenticated(profile)) {
          // Unsupported role — reject the session.
          setUnauthenticated();
        }
      } catch {
        if (isMounted) setUnauthenticated();
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [setAuthenticated, setUnauthenticated]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        // 1. Call Backend Login API (returns accessToken + sets refreshToken cookie)
        await loginApi({ email, password });
        setHasRefreshSession(true);

        // 2. Fetch User Profile with the new accessToken
        const profile = await getMeApi();
        if (!setAuthenticated(profile)) {
          throw new Error('Your account role is not supported. Please contact an administrator.');
        }
      } catch (err: unknown) {
        setUnauthenticated();
        if (err instanceof Error) {
          throw err;
        }
        throw new Error('Login failed. Please check your connection and try again.');
      }
    },
    [setAuthenticated, setUnauthenticated],
  );

  const switchRole = useCallback((role: UserRole) => {
    setState((prev) => ({
      ...prev,
      currentRole: role,
      user: ROLE_TO_USER[role],
    }));
  }, []);

  const logout = useCallback(() => {
    // Fire and forget logout API call
    logoutApi().catch(() => {});
    setHasRefreshSession(false);
    setUnauthenticated();
  }, [setUnauthenticated]);

  return (
    <AuthContext.Provider value={{ ...state, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
