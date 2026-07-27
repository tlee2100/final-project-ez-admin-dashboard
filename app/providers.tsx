'use client';

import { App, ConfigProvider } from 'antd';

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 6,
          colorPrimary: '#1677ff',
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
