import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

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

// Sentry 설정
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,

  // Webpack treeshaking 설정으로 disableLogger 대체
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
