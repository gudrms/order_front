'use client';

import { useWebPush } from '@/hooks/useWebPush';

/**
 * FCM 웹 푸시 초기화 컴포넌트.
 * AuthProvider 내부에서 한 번만 마운트되어야 합니다.
 * providers.tsx에서 <AuthProvider> 바로 안에 배치하세요.
 */
export function WebPushHandler() {
  useWebPush();
  return null;
}
