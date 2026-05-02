'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function FailContent() {
    const searchParams = useSearchParams();
    const reportedRef = useRef(false);
    const orderId = searchParams.get('orderId');
    const code = searchParams.get('code') || 'PAYMENT_FAILED';
    const message = searchParams.get('message') || '결제가 완료되지 않았습니다.';

    useEffect(() => {
        if (!orderId || reportedRef.current) return;
        reportedRef.current = true;
        void fetch(`${API_URL}/payments/toss/fail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, code, message }),
        }).catch(() => undefined);
    }, [code, message, orderId]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-sm">
                <XCircle className="mx-auto mb-4 text-red-500" size={48} />
                <h1 className="mb-2 text-2xl font-black">결제가 취소되었습니다.</h1>
                <p className="mb-5 text-sm text-gray-600">{message}</p>
                <Link href="/order" className="block rounded-lg bg-brand-black px-4 py-3 font-bold text-white">
                    다시 주문하기
                </Link>
            </div>
        </main>
    );
}

export default function FailPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
            <FailContent />
        </Suspense>
    );
}
