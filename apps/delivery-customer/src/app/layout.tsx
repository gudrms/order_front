import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';
import PWAInstaller from '@/components/PWAInstaller';

export const metadata: Metadata = {
  title: '배달 주문',
  description: '우리 브랜드 배달 주문 앱',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '배달앱',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFD700',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <PWAInstaller />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
