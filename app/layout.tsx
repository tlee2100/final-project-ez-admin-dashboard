import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from 'next';
import { AppProviders } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ez-chatbot Admin',
  description: 'Quản trị chatbot AI, dữ liệu và booking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <AppProviders>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
