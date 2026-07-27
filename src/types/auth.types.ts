export type UserRole = 'superadmin' | 'admin' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  sites?: string[]; // siteIds managed by this user (admin/agent)
}

export interface AuthState {
  user: User | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
}

export interface RoleConfig {
  label: string;
  color: string; // Ant Design tag color
  badge: string; // badge text
  navItems: NavItemKey[];
}

export type NavItemKey =
  'dashboard' | 'sites' | 'live-chats' | 'bookings' | 'analytics' | 'users' | 'settings';

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  superadmin: {
    label: 'Super Admin',
    color: 'purple',
    badge: 'Super Admin',
    navItems: ['dashboard', 'sites', 'live-chats', 'bookings', 'analytics', 'users', 'settings'],
  },
  admin: {
    label: 'Admin',
    color: 'blue',
    badge: 'Admin',
    navItems: ['dashboard', 'sites', 'live-chats', 'bookings'],
  },
  agent: {
    label: 'Agent',
    color: 'orange',
    badge: 'Agent',
    navItems: ['dashboard', 'live-chats', 'bookings'],
  },
};
