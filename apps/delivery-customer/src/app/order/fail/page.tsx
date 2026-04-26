'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useFailTossPayment } from '@/hooks/mutations/useFailTossPayment';

const PENDING_TOSS_ORDER_ID_KEY = 'delivery.pendingTossOrderId';

function FailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const failMutation = useFailTossPayment();
    const hasReportedRef = useRef(false);

    const orderId = searchParams.get('orderId') || '';
    const code = searchParams.get('code') || undefined;
    const message = searchParams.get('message') || '결제가 완료되지 않았습니다.';

    useEffect(() => {
        if (!orderId || hasReportedRef.current) return;

        hasReportedRef.current = true;
        failMutation.mutate(
            {
                orderId,
                code,
                message,
            },
            {
                onSettled: () => {
                    sessionStorage.removeItem(PENDING_TOSS_ORDER_ID_KEY);
                },
            }
        );
    }, [code, failMutation, message, orderId]);

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <AlertTriangle size={34} />
                </div>

                <h1 className="text-2xl font-bold mb-2">결제가 완료되지 않았어요</h1>
                <p className="text-gray-600 mb-3">
                    카드 결제가 승인되지 않아 주문이 접수되지 않았습니다.
                </p>

                {message && (
                    <p className="mb-6 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        {message}
                    </p>
                )}

                <div className="space-y-2">
                    <button
                        onClick={() => router.push('/order/checkout')}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold"
                    >
                        다시 결제하기
                    </button>
                    <button
                        onClick={() => router.push('/menu')}
                        className="w-full border-2 border-gray-200 p-4 rounded-xl font-bold"
                    >
                        메뉴로 돌아가기
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function FailPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </main>
        }>
            <FailContent />
        </Suspense>
    );
}
