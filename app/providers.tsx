'use client';

import React from 'react';
import { App, ConfigProvider } from 'antd';
import { Refine, type CanParams } from '@refinedev/core';
import { useNotificationProvider } from '@refinedev/antd';
import routerProvider from '@refinedev/nextjs-router';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { NotificationProvider } from '@/src/contexts/NotificationContext';
import { combinedDataProvider } from '@/src/lib/dataProvider/combinedDataProvider';

// ── Shared Ant Design theme ──────────────────────────────────────────────────
const antdTheme = {
  token: {
    colorPrimary: '#6366f1',
    borderRadius: 8,
    fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    colorBgContainer: '#ffffff',
    colorBorder: '#e5e7eb',
    colorText: '#111827',
    colorTextSecondary: '#6b7280',
    colorFill: '#f3f4f6',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0,0,0,0.08)',
  },
  components: {
    Menu: {
      itemBorderRadius: 8,
      itemHoverBg: '#f5f3ff',
      itemActiveBg: '#ede9fe',
      itemSelectedBg: '#ede9fe',
      itemSelectedColor: '#4f46e5',
    },
    Button: { borderRadius: 8, fontWeight: 500 },
    Select: { borderRadius: 8 },
    Card: { borderRadius: 12 },
    Table: { borderRadius: 12 },
  },
};

// ── Refine resource definitions ───────────────────────────────────────────────
const resources = [
  {
    name: 'dashboard',
    list: '/dashboard',
    meta: { label: 'Dashboard' },
  },
  {
    name: 'organizations',
    list: '/organizations',
    meta: { label: 'Organizations' },
  },
  {
    name: 'sites',
    list: '/sites',
    show: '/sites/:id',
    create: '/sites/new',
    meta: { label: 'Sites' },
  },
  {
    name: 'users',
    list: '/users',
    meta: { label: 'Users' },
  },
];

// ── Refine Inner Providers wrapper to use AuthContext ────────────────────────
function RefineInnerProviders({ children }: { children: React.ReactNode }) {
  const notificationProvider = useNotificationProvider();
  const { currentRole } = useAuth();

  const accessControlProvider = React.useMemo(() => {
    const isManager = currentRole === 'super_admin' || currentRole === 'admin';
    return {
      // Client-side policy is UX-only (hides/disables controls); the API
      // enforces authorization and tenant scope on every request. Deny by
      // default so any unlisted resource is hidden rather than exposed.
      can: async ({ resource, action }: CanParams) => {
        switch (resource) {
          case 'dashboard':
            return { can: true };
          case 'organizations':
            if (isManager) return { can: true };
            return { can: action === 'list' || action === 'show' };
          case 'sites':
            if (isManager) return { can: true };
            if (currentRole === 'agent' && action) {
              // Agent is read-only for the sites resource
              return { can: ['list', 'show'].includes(action) };
            }
            return { can: false, reason: 'Insufficient role for sites' };
          case 'users':
            if (isManager) return { can: true };
            return { can: action === 'show' };
          default:
            return {
              can: false,
              reason: `No access policy for resource '${resource}'`,
            };
        }
      },
    };
  }, [currentRole]);

  return (
    <React.Suspense fallback={null}>
      <Refine
        dataProvider={combinedDataProvider}
        routerProvider={routerProvider}
        notificationProvider={notificationProvider}
        accessControlProvider={accessControlProvider}
        resources={resources}
        options={{
          disableTelemetry: true,
          syncWithLocation: false, // we handle our own URL state
        }}
      >
        {children}
      </Refine>
    </React.Suspense>
  );
}

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

// ── Provider tree ─────────────────────────────────────────────────────────────
export function AppProviders({
  children,
  session,
}: Readonly<{ children: React.ReactNode; session: Session | null }>) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <SessionProvider session={session} refetchOnWindowFocus={false}>
          <AuthProvider>
            <NotificationProvider>
              <RefineInnerProviders>{children}</RefineInnerProviders>
            </NotificationProvider>
          </AuthProvider>
        </SessionProvider>
      </App>
    </ConfigProvider>
  );
}
