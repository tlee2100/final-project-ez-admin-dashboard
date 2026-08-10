import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Spin } from 'antd';
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

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SetPasswordForm />
    </Suspense>
  );
}
