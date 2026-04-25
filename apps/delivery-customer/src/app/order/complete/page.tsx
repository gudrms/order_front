'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompletePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/orders');
    }, [router]);

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-yellow mx-auto mb-4" />
                <p className="text-lg font-medium">주문 내역으로 이동 중...</p>
            </div>
        </main>
    );
}
