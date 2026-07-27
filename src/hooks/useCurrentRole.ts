'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { ROLE_CONFIGS } from '@/src/types/auth.types';
import type { UserRole } from '@/src/types/auth.types';

/**
 * Convenience hook — returns everything needed for role-aware rendering.
 */
export function useCurrentRole() {
  const { currentRole, user, switchRole } = useAuth();
  const roleConfig = ROLE_CONFIGS[currentRole];

  const hasAccess = (navKey: string) =>
    roleConfig.navItems.includes(navKey as Parameters<typeof roleConfig.navItems.includes>[0]);

  const isSuperAdmin = currentRole === 'superadmin';
  const isAdmin = currentRole === 'admin';
  const isAgent = currentRole === 'agent';

  return {
    currentRole,
    roleConfig,
    user,
    switchRole,
    hasAccess,
    isSuperAdmin,
    isAdmin,
    isAgent,
    availableRoles: ['superadmin', 'admin', 'agent'] as UserRole[],
  };
}
