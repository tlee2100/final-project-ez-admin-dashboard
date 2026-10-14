'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout/DashboardLayout';
import { Skeleton } from 'antd';
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
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Skeleton.Button active style={{ width: 180, height: 32, borderRadius: 8 }} />
            <Skeleton.Button active style={{ width: 120, height: 32, borderRadius: 8 }} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid #f0f0f0',
                  height: 104,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Skeleton.Input active size="small" style={{ width: '50%', height: 16 }} />
                <Skeleton.Button active style={{ width: 60, height: 28, borderRadius: 6 }} />
              </div>
            ))}
          </div>
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 16,
              border: '1px solid #f0f0f0',
              minHeight: 280,
            }}
          >
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
