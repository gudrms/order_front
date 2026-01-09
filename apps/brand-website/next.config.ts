import type { NextConfig } from 'next';

// Trigger rebuild for Vercel deployment

const nextConfig: NextConfig = {
  // 정적 사이트로 빌드 가능 (선택)
  // output: 'export',

  transpilePackages: ['@order/shared'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
