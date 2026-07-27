'use client';

import { App, ConfigProvider } from 'antd';
import { AuthProvider } from '@/src/contexts/AuthContext';

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ConfigProvider
      theme={{
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
          Button: {
            borderRadius: 8,
            fontWeight: 500,
          },
          Select: {
            borderRadius: 8,
          },
          Card: {
            borderRadius: 12,
          },
        },
      }}
    >
      <App>
        <AuthProvider>{children}</AuthProvider>
      </App>
    </ConfigProvider>
  );
}
