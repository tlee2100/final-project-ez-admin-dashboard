import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from 'next';
import { AppProviders } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ez-chatbot Admin — AI Chatbot Dashboard',
  description:
    'Multi-tenant AI chatbot admin dashboard. Manage sites, knowledge base, live chats, bookings, and analytics.',
  keywords: ['chatbot', 'admin', 'AI', 'dashboard', 'booking'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AntdRegistry>
          <AppProviders>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
