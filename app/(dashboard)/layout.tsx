'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout/DashboardLayout';
import { Spin } from 'antd';
import { useSession } from 'next-auth/react';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (isLoading || status === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f8fafc',
        }}
      >
        <Spin size="large" percent="auto" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <DashboardLayout pageName="AI Chatbot Admin">{children}</DashboardLayout>;
}
