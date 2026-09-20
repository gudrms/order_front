'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * 인앱 브라우저(Capacitor Browser) 결제 복귀용 브리지 페이지.
 *
 * 네이티브 앱에서는 결제창을 인앱 브라우저로 띄우는데, 결제가 끝나고 토스가
 * successUrl/failUrl로 돌려보내는 곳은 인앱 브라우저 안이라 앱 세션이 없다.
 * (결제 승인 API는 로그인 세션이 필요하므로 반드시 앱 웹뷰에서 처리해야 한다.)
 *
 * 그래서 토스에는 이 페이지를 successUrl/failUrl로 주고, 여기서 커스텀 스킴
 * (taco://...)으로 한 번 더 튕겨 OS가 앱을 깨우도록 한다. App Links 검증이
 * 동작하면 이 페이지까지 오지도 않고 바로 앱으로 넘어가므로, 이 페이지는
 * App Links가 동작하지 않는 환경을 위한 보험이다.
 *
 * target 예시: store/{storeId}/order/success
 */
function ReturnBridge() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const target = params.get('target');
        params.delete('target');

        if (!target) return;

        const query = params.toString();
        window.location.replace(`taco://${target}${query ? `?${query}` : ''}`);
    }, [searchParams]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-yellow" />
            <p className="text-sm text-gray-600">앱으로 돌아가는 중입니다...</p>
            <p className="text-xs text-gray-400">
                자동으로 이동하지 않으면 이 창을 닫고 앱에서 주문 내역을 확인해 주세요.
            </p>
        </main>
    );
}

export default function OrderReturnPage() {
    return (
        <Suspense fallback={null}>
            <ReturnBridge />
        </Suspense>
    );
}
