import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spin } from 'antd';
import { notFound } from 'next/navigation';
import { SetPasswordForm } from '@/src/features/auth/SetPasswordForm';

export const metadata: Metadata = {
  title: 'Set Password — ez-chatbot Admin',
  description: 'Set your password and activate your ez-chatbot account',
};

function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spin size="large" />
    </div>
  );
}

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/validate-activation-token?token=${token}`,
      { cache: 'no-store' },
    );
    if (!res.ok) {
      notFound();
    }
  } catch (error) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <SetPasswordForm />
    </Suspense>
  );
}
