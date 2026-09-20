'use client';

import { Suspense, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useSearchParams } from 'next/navigation';
import type { PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';

const TossPaymentWidget = dynamic(
    () => import('@order/ui/payment').then((m) => ({ default: m.TossPaymentWidget })),
    { ssr: false },
);

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
const isTossWidgetClientKey = (key?: string): key is string =>
    !!key && (key.startsWith('test_gck_') || key.startsWith('live_gck_'));

/**
 * 네이티브 앱 전용 결제 페이지.
 *
 * Capacitor 웹뷰는 외부 도메인으로의 최상위 이동을 앱 밖(시스템 브라우저)으로
 * 넘겨버리기 때문에, 카드사·은행 승인 페이지로 계속 리다이렉트되는 토스 결제창을
 * 앱 웹뷰에서 직접 띄우면 앱을 이탈하게 된다. 그래서 결제창만 이 페이지로 분리해
 * 인앱 브라우저(@capacitor/browser)로 열고, 이후 리다이렉트는 전부 그 안에서 돌게 한다.
 *
 * 주문은 checkout에서 이미 생성된 뒤이므로, 결제위젯을 띄우는 데 필요한 값만
 * 쿼리로 받는다. (이 페이지는 앱 세션이 없는 인앱 브라우저에서 열리므로
 * 인증이 필요한 API를 호출하지 않는다.)
 */
function PayContent() {
    const { storeId } = useParams<{ storeId: string }>();
    const searchParams = useSearchParams();
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const orderId = searchParams.get('orderId');
    const orderName = searchParams.get('orderName') || '주문';
    const customerKey = searchParams.get('customerKey') || 'ANONYMOUS';
    const customerName = searchParams.get('customerName') || undefined;
    const customerEmail = searchParams.get('customerEmail') || undefined;
    const amount = Number(searchParams.get('amount'));

    const isValidRequest = !!orderId && Number.isFinite(amount) && amount > 0;

    const handlePay = async () => {
        const paymentWidget = paymentWidgetRef.current;
        if (!paymentWidget || !orderId) return;

        try {
            setIsRequesting(true);
            setError(null);

            const origin = window.location.origin;
            // 결제 완료 후에는 앱 웹뷰로 돌아가야 결제 승인(로그인 필요)을 처리할 수 있다.
            const returnUrl = (path: string) =>
                `${origin}/order/return?target=${encodeURIComponent(`store/${storeId}/order/${path}`)}`;

            await paymentWidget.requestPayment({
                orderId,
                orderName,
                customerName,
                customerEmail,
                // 카드사 앱(ISP/앱카드) 인증 후 우리 앱으로 돌아오기 위한 커스텀 스킴.
                // AndroidManifest의 taco 스킴 intent-filter와 짝이다.
                appScheme: 'taco://',
                successUrl: returnUrl('success'),
                failUrl: returnUrl('fail'),
            });
        } catch (err) {
            console.error('결제 요청 오류:', err);
            setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
        } finally {
            setIsRequesting(false);
        }
    };

    if (!isValidRequest) {
        return (
            <main className="min-h-screen flex items-center justify-center px-6 text-center">
                <p className="text-sm text-gray-600">결제 정보가 올바르지 않습니다. 앱에서 다시 시도해 주세요.</p>
            </main>
        );
    }

    if (!isTossWidgetClientKey(TOSS_CLIENT_KEY)) {
        return (
            <main className="min-h-screen flex items-center justify-center px-6 text-center">
                <p className="text-sm text-red-500">결제 설정이 준비되지 않았습니다. 관리자에게 문의해 주세요.</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-28">
            <header className="bg-white px-4 py-4 border-b border-gray-100">
                <h1 className="font-bold text-lg">결제</h1>
                <p className="mt-1 text-sm text-gray-500">{orderName}</p>
            </header>

            <section className="bg-white mt-2 p-4">
                <TossPaymentWidget
                    clientKey={TOSS_CLIENT_KEY}
                    customerKey={customerKey}
                    amount={amount}
                    onWidgetReady={(widget) => {
                        paymentWidgetRef.current = widget;
                    }}
                />
            </section>

            {error && (
                <p className="px-4 py-3 text-sm text-red-500">{error}</p>
            )}

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe">
                <button
                    type="button"
                    onClick={handlePay}
                    disabled={isRequesting}
                    className="w-full bg-brand-black text-white p-4 rounded-xl font-bold text-lg disabled:opacity-60"
                >
                    {isRequesting ? '결제창 여는 중...' : `${amount.toLocaleString()}원 결제하기`}
                </button>
            </div>
        </main>
    );
}

export default function PayPage() {
    return (
        <Suspense fallback={null}>
            <PayContent />
        </Suspense>
    );
}
