export type UserRole = 'super_admin' | 'admin' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  sites?: string[]; // siteIds managed by this user (admin/agent)
  organizationId?: string | null;
}

export interface AuthState {
  user: User | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RoleConfig {
  label: string;
  color: string; // Ant Design tag color
  badge: string; // badge text
  navItems: NavItemKey[];
}

export type NavItemKey =
  | 'dashboard'
  | 'organizations'
  | 'sites'
  | 'live-chats'
  | 'bookings'
  | 'analytics'
  | 'users'
  | 'settings';

export function normalizeUserRole(role: string): UserRole | null {
  if (!role) return null;
  const r = role.toUpperCase();
  if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN') return 'super_admin';
  if (r === 'ADMIN') return 'admin';
  if (r === 'AGENT') return 'agent';
  // Unknown role — reject the session rather than escalate privileges.
  return null;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  super_admin: {
    label: 'Super Admin',
    color: 'purple',
    badge: 'Super Admin',
    navItems: [
      'dashboard',
      'organizations',
      'sites',
      'live-chats',
      'bookings',
      'analytics',
      'users',
      'settings',
    ],
  },
  admin: {
    label: 'Admin',
    color: 'blue',
    badge: 'Admin',
    navItems: [
      'dashboard',
      'organizations',
      'sites',
      'live-chats',
      'bookings',
      'analytics',
      'users',
      'settings',
    ],
  },

  agent: {
    label: 'Agent',
    color: 'orange',
    badge: 'Agent',
    navItems: ['dashboard', 'sites', 'live-chats', 'bookings'],
  },
};
