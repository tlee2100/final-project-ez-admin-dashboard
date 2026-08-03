import type { Metadata } from 'next';
import { LoginForm } from '@/src/features/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In — ez-chatbot Admin',
  description: 'Sign in to the ez-chatbot Admin Dashboard',
};

export default function LoginPage() {
  return <LoginForm />;
}
