import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Capacitor용 Static Export 설정
  output: 'export',

  // 이미지 최적화 비활성화 (Static Export 필수)
  images: {
    unoptimized: true,
  },

  // Trailing slash 추가 (Capacitor 호환성)
  trailingSlash: true,

  transpilePackages: ['@order/shared'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
