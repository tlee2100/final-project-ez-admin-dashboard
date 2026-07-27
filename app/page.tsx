import { redirect } from 'next/navigation';

/**
 * Root page — redirect to /dashboard.
 * The actual dashboard lives in app/(dashboard)/dashboard/page.tsx
 */
export default function RootPage() {
  redirect('/dashboard');
}
