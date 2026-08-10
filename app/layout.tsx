import '@ant-design/v5-patch-for-react-19';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from 'next';
import { AppProviders } from './providers';
import { auth } from './auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'ez-chatbot Admin — AI Chatbot Dashboard',
  description:
    'Multi-tenant AI chatbot admin dashboard. Manage sites, knowledge base, live chats, bookings, and analytics.',
  keywords: ['chatbot', 'admin', 'AI', 'dashboard', 'booking'],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AntdRegistry>
          <AppProviders session={session}>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
