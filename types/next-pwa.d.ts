/**
 * @ducanh2912/next-pwa 타입 정의
 * 
 * Turbopack을 지원하는 next-pwa fork
 */

declare module "@ducanh2912/next-pwa" {
  import { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    cacheOnFrontEndNav?: boolean;
    aggressiveFrontEndNavCaching?: boolean;
    reloadOnOnline?: boolean;
    swcMinify?: boolean;
    workboxOptions?: {
      disableDevLogs?: boolean;
      runtimeCaching?: Array<{
        urlPattern: RegExp | string;
        handler: 
          | "CacheFirst" 
          | "CacheOnly" 
          | "NetworkFirst" 
          | "NetworkOnly" 
          | "StaleWhileRevalidate";
        options?: {
          cacheName?: string;
          expiration?: {
            maxEntries?: number;
            maxAgeSeconds?: number;
          };
          networkTimeoutSeconds?: number;
        };
      }>;
    };
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  
  export default withPWA;
}
