'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserRole, User, AuthState } from '@/src/types/auth.types';
import { normalizeUserRole } from '@/src/types/auth.types';
import { useSession, signIn, signOut } from 'next-auth/react';

// ── Mock user data ──────────────────────────────────────────────────────────
const MOCK_ADMIN: User = {
  id: 'u-001',
  name: 'Alex Johnson',
  email: 'alex@ezchatbot.io',
  avatar: undefined,
  role: 'super_admin',
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
  super_admin: MOCK_ADMIN,
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

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [switchedRole, setSwitchedRole] = useState<UserRole | null>(null);

  const isAuthenticated =
    status === 'authenticated' && session?.error !== 'RefreshAccessTokenError';
  const isLoading = status === 'loading';

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      void signOut({ callbackUrl: '/login' });
    }
  }, [session?.error]);

  const user: User | null = session?.user
    ? {
        id: session.user.id as string,
        email: session.user.email as string,
        role: normalizeUserRole(session.user.role as string) ?? 'agent',
        name: session.user.email?.split('@')[0] || 'User',
        organizationId: session.user.organizationId,
      }
    : null;

  const currentRole = switchedRole || (user?.role ?? 'super_admin');

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      throw new Error('Login failed. Please check your credentials.');
    }
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setSwitchedRole(role);
  }, []);

  const logout = useCallback(() => {
    // Optional: Call backend logout API to invalidate token in DB if needed
    // logoutApi().catch(() => {});
    signOut({ redirect: true, callbackUrl: '/login' });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: switchedRole ? ROLE_TO_USER[switchedRole] : user,
        currentRole,
        isAuthenticated,
        isLoading,
        login,
        switchRole,
        logout,
      }}
    >
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
