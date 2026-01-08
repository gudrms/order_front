import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@order/shared'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
