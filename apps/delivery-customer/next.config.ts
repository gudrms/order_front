import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Remote WebView/SSR deployment keeps runtime routes such as /orders/[id].
  images: {
    unoptimized: true,
  },

  trailingSlash: true,

  transpilePackages: ['@order/shared'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // 프로덕션 빌드에서 console.log 제거 (console.error/warn 유지)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
  // NOTE: 빌드 로그에 "ReferenceError: location is not defined" 경고가 표시되나
  // @sentry/nextjs instrumentation 내부 코드 이슈로 빌드는 정상 완료되고 런타임에 무관함.
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
