'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserRole, User, AuthState } from '@/src/types/auth.types';

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
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: MOCK_ADMIN,
    currentRole: 'superadmin',
    isAuthenticated: true,
  });

  const switchRole = useCallback((role: UserRole) => {
    setState((prev) => ({
      ...prev,
      currentRole: role,
      user: ROLE_TO_USER[role],
    }));
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, currentRole: 'superadmin', isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, switchRole, logout }}>{children}</AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
