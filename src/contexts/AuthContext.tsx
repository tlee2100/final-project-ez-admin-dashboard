'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserRole, User, AuthState } from '@/src/types/auth.types';

// ── Mock user data ──────────────────────────────────────────────────────────
const MOCK_USER: User = {
  id: 'u-001',
  name: 'Alex Johnson',
  email: 'alex@ezchatbot.io',
  avatar: undefined, // will use initials
  role: 'superadmin',
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
    user: MOCK_USER,
    currentRole: 'superadmin',
    isAuthenticated: true,
  });

  const switchRole = useCallback((role: UserRole) => {
    setState((prev) => ({ ...prev, currentRole: role }));
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
