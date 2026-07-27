'use client';

import { DashboardLayout } from '@/src/components/layout/DashboardLayout/DashboardLayout';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout pageName="AI Chatbot Admin">{children}</DashboardLayout>;
}
