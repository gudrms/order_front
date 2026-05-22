import type { Metadata } from 'next';
import { Noto_Sans_KR, Outfit } from 'next/font/google';
import './globals.css';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tacomole.kr'),
  title: {
    default: '타코몰리 (TACO MOLE) - Authentic Mexican Taste',
    template: '%s | 타코몰리',
  },
  description: '신선한 재료와 정통 멕시칸 레시피의 만남, 타코몰리 공식 홈페이지입니다.',
  keywords: ['타코몰리', '타코', '멕시칸', '배달', 'TACO MOLE', 'Mexican', '배달앱'],
  authors: [{ name: '타코몰리' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://www.tacomole.kr',
    siteName: '타코몰리',
    title: '타코몰리 (TACO MOLE) - Authentic Mexican Taste',
    description: '신선한 재료와 정통 멕시칸 레시피의 만남, 타코몰리 공식 홈페이지입니다.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '타코몰리 (TACO MOLE) - Authentic Mexican Taste',
    description: '신선한 재료와 정통 멕시칸 레시피의 만남, 타코몰리 공식 홈페이지입니다.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

import { Analytics } from '@vercel/analytics/next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${outfit.variable}`}>
      <body>
        <Navbar />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
