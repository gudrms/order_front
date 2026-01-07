import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '타코몰리 (Taco Molly) - Authentic Mexican Taste',
  description: '신선한 재료와 정통 멕시칸 레시피의 만남, 타코몰리 공식 홈페이지입니다.',
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
