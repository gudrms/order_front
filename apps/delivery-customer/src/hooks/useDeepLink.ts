'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@order/shared/lib/supabase';
import { addDeepLinkListener } from '@/lib/capacitor/app';

/**
 * Capacitor 딥링크를 Next.js 라우터와 연결.
 *
 * 지원 URL 패턴:
 *   https://delivery.tacomole.kr/orders/abc123  → /orders/abc123
 *   https://delivery.tacomole.kr/mypage         → /mypage
 *   taco://orders/abc123                     → /orders/abc123
 *
 * AppLayout 에서 한 번만 마운트한다.
 */
export function useDeepLink() {
    const router = useRouter();

    useEffect(() => {
        const createOAuthSessionFromUrl = async (url: URL) => {
            const params = new URLSearchParams(
                url.hash ? url.hash.slice(1) : url.search
            );
            const code = params.get('code');
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            console.info('[DeepLink] OAuth callback payload', {
                hasCode: !!code,
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
            });

            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);

                if (error) {
                    console.error('[DeepLink] OAuth code 교환 실패:', error);
                } else {
                    console.info('[DeepLink] OAuth code session restored');
                }
                return;
            }

            if (!accessToken || !refreshToken) return;

            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            if (error) {
                console.error('[DeepLink] OAuth 세션 복원 실패:', error);
            } else {
                console.info('[DeepLink] OAuth token session restored');
            }
        };

        const unsubscribe = addDeepLinkListener((url) => {
            try {
                const parsed = new URL(url);
                // custom scheme: taco://orders/abc123 → /orders/abc123
                // OAuth callback: taco://auth/callback → /auth/callback
                // https scheme: https://delivery.tacomole.kr/orders/abc123 → pathname = /orders/abc123
                const pathname =
                    parsed.protocol === 'taco:' && parsed.hostname
                        ? `/${parsed.hostname}${parsed.pathname}`
                        : parsed.pathname;
                const search = parsed.search;

                console.info('[DeepLink] app URL opened', {
                    protocol: parsed.protocol,
                    host: parsed.host,
                    pathname,
                    hasSearch: !!search,
                    hasHash: !!parsed.hash,
                });

                if (pathname && pathname !== '/') {
                    void createOAuthSessionFromUrl(parsed).finally(() => {
                        router.push(pathname + search);
                    });
                }
            } catch (e) {
                console.warn('[DeepLink] URL 파싱 실패:', url, e);
            }
        });

        return unsubscribe;
    }, [router]);
}
