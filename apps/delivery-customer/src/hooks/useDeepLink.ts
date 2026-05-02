'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDeepLinkListener } from '@/lib/capacitor/app';

/**
 * Capacitor 딥링크를 Next.js 라우터와 연결.
 *
 * 지원 URL 패턴:
 *   https://delivery.taco.com/orders/abc123  → /orders/abc123
 *   https://delivery.taco.com/mypage         → /mypage
 *   taco://orders/abc123                     → /orders/abc123
 *
 * AppLayout 에서 한 번만 마운트한다.
 */
export function useDeepLink() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = addDeepLinkListener((url) => {
            try {
                const parsed = new URL(url);
                // custom scheme: taco://orders/abc123 → pathname = /orders/abc123
                // https scheme: https://delivery.taco.com/orders/abc123 → pathname = /orders/abc123
                const pathname = parsed.pathname;
                const search = parsed.search;

                if (pathname && pathname !== '/') {
                    router.push(pathname + search);
                }
            } catch (e) {
                console.warn('[DeepLink] URL 파싱 실패:', url, e);
            }
        });

        return unsubscribe;
    }, [router]);
}
