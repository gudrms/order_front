'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, RotateCcw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const PENDING_ORDER_KEY = 'brand.homepage.pendingOrder';

async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const message = payload?.message || '결제 승인 처리 중 오류가 발생했습니다.';
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }
    return payload?.data ?? payload;
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const processedRef = useRef(false);
    const [isProcessing, setIsProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);

    const confirmPayment = async () => {
        const orderId = searchParams.get('orderId');
        const paymentKey = searchParams.get('paymentKey');
        const amount = Number(searchParams.get('amount'));

        if (!orderId || !paymentKey || !amount) {
            setError('결제 승인에 필요한 정보가 부족합니다.');
            setIsProcessing(false);
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);
            const result = await postJson<{ orderNumber: string }>(`${API_URL}/payments/toss/confirm`, {
                orderId,
                paymentKey,
                amount,
            });
            sessionStorage.removeItem(PENDING_ORDER_KEY);
            setOrderNumber(result.orderNumber);
        } catch (err) {
            setError(err instanceof Error ? err.message : '결제 승인 처리 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;
        void confirmPayment();
        // confirmPayment intentionally runs once for the Toss redirect payload.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isProcessing) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-center">
                <div>
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-b-brand-green" />
                    <p className="font-bold">결제를 승인하고 있습니다.</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-sm">
                    <h1 className="mb-2 text-2xl font-black">결제 확인 필요</h1>
                    <p className="mb-5 text-sm text-gray-600">{error}</p>
                    <button onClick={() => void confirmPayment()} className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-black px-4 py-3 font-bold text-white">
                        <RotateCcw size={17} />
                        다시 확인하기
                    </button>
                    <Link href="/order" className="block rounded-lg border border-gray-200 px-4 py-3 font-bold">
                        주문으로 돌아가기
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-sm">
                <CheckCircle2 className="mx-auto mb-4 text-brand-green" size={48} />
                <h1 className="mb-2 text-2xl font-black">주문이 접수되었습니다.</h1>
                <p className="mb-5 text-sm text-gray-600">매장에서 주문을 확인한 뒤 조리를 시작합니다.</p>
                <div className="mb-5 rounded-lg bg-gray-50 p-4 text-left">
                    <div className="flex justify-between">
                        <span className="text-gray-500">주문번호</span>
                        <span className="font-black">{orderNumber || '-'}</span>
                    </div>
                </div>
                <Link href="/" className="block rounded-lg bg-brand-black px-4 py-3 font-bold text-white">
                    홈으로
                </Link>
            </div>
        </main>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
            <SuccessContent />
        </Suspense>
    );
}
