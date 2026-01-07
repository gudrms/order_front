import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '배달 주문',
  description: '우리 브랜드 배달 주문 앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
