'use client';

import { useEffect, useState } from 'react';

/**
 * MSW Provider
 * 개발 환경에서만 MSW를 활성화
 */
export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const initMSW = async () => {
      // 프로덕션 환경에서는 MSW 비활성화
      if (process.env.NODE_ENV === 'production') {
        setMswReady(true);
        return;
      }

      // 개발 환경에서만 MSW 활성화
      if (typeof window !== 'undefined') {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass', // 처리되지 않은 요청은 그대로 통과
        });
        setMswReady(true);
      }
    };

    initMSW();
  }, []);

  // MSW가 준비될 때까지 children을 렌더링하지 않음
  if (!mswReady) {
    return null;
  }

  return <>{children}</>;
}
