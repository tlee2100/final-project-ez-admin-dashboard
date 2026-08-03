import type { Metadata } from 'next';
import { LandingPage } from '@/src/features/landing/LandingPage';
import { ClientChatWidgetLoader } from './ClientChatWidgetLoader';

export const metadata: Metadata = {
  title: 'AI Chatbot — Intelligent Conversations & Automation',
  description:
    'Enhance customer engagement with our powerful AI chatbot. Automate support, boost conversions, and deliver personalized experiences 24/7.',
  keywords: ['AI Chatbot', 'Customer Support', 'Automation', 'Live Chat', 'Zodinet'],
};

/**
 * Public Landing Page route (`/landing`).
 * Accessible without authentication.
 */
export default function Page() {
  return (
    <>
      <LandingPage />
      <ClientChatWidgetLoader />
    </>
  );
}
