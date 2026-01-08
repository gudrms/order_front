'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeliveryStore } from '@/stores/deliveryStore';

function CompleteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { deliveryInfo } = useDeliveryStore();

    const orderNumber = searchParams.get('orderNumber');

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-2xl font-bold mb-2">주문 완료!</h1>
                <p className="text-gray-600 mb-6">
                    주문이 성공적으로 접수되었습니다.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">주문번호</span>
                        <span className="font-bold">{orderNumber}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">결제 방법</span>
                        <span className="font-medium">만나서 결제</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">배달 주소</span>
                        <span className="font-medium text-sm text-right">
                            {deliveryInfo.address?.address}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">예상 배달 시간</span>
                        <span className="font-medium">30-40분</span>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm text-blue-800">
                    <p>배달 시 현금으로 결제해주세요.</p>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => router.push('/orders')}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold"
                    >
                        주문 내역 보기
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full border-2 border-gray-200 p-4 rounded-xl font-bold"
                    >
                        홈으로
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function CompletePage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-yellow mx-auto mb-4" />
                    <p className="text-lg font-medium">로딩 중...</p>
                </div>
            </main>
        }>
            <CompleteContent />
        </Suspense>
    );
}
