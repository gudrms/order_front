'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useCartStore } from '@order/order-core';
import { useConfirmTossPayment } from '@/hooks/mutations/useConfirmTossPayment';
import { useCurrentStore } from '@/contexts/StoreContext';
import { useDeliveryStore } from '@/stores/deliveryStore';

const PENDING_TOSS_ORDER_ID_KEY = 'delivery.pendingTossOrderId';

function SuccessContent() {
    const router = useRouter();
    const { storeId } = useParams<{ storeId: string }>();
    const searchParams = useSearchParams();
    const { clearCart } = useCartStore();
    const { store } = useCurrentStore();
    const { deliveryInfo } = useDeliveryStore();
    const confirmTossPaymentMutation = useConfirmTossPayment();
    const hasProcessedRef = useRef(false);

    const [isProcessing, setIsProcessing] = useState(true);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const processPayment = async (force = false) => {
        if (hasProcessedRef.current && !force) return;
        hasProcessedRef.current = true;

        const orderId = searchParams.get('orderId');
        const paymentKey = searchParams.get('paymentKey');
        const amount = searchParams.get('amount');
        const parsedAmount = amount ? Number(amount) : NaN;

        if (!orderId || !paymentKey || !amount || Number.isNaN(parsedAmount)) {
            setError('결제 승인에 필요한 정보가 올바르지 않습니다.');
            setIsProcessing(false);
            return;
        }

        try {
            setError(null);
            setIsProcessing(true);
            const result = await confirmTossPaymentMutation.mutateAsync({ orderId, paymentKey, amount: parsedAmount });
            clearCart();
            sessionStorage.removeItem(PENDING_TOSS_ORDER_ID_KEY);
            setConfirmedOrderId(result.id);
            setOrderNumber(result.orderNumber);
        } catch (err) {
            console.error('결제 승인 처리 오류:', err);
            setError('결제는 완료되었지만 주문 승인 처리 중 오류가 발생했습니다. 잠시 후 다시 확인해 주세요.');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        void processPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isProcessing) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-yellow mx-auto mb-4" />
                    <p className="text-lg font-medium">결제를 승인하고 있습니다.</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                    <div className="text-5xl mb-4">!</div>
                    <h1 className="text-2xl font-bold mb-2">결제 승인 확인 필요</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => void processPayment(true)}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={18} />
                        다시 승인 확인하기
                    </button>
                    <button
                        onClick={() => router.push('/orders')}
                        className="mt-2 w-full border-2 border-gray-200 p-4 rounded-xl font-bold"
                    >
                        주문 내역으로 이동
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <CheckCircle2 size={38} />
                </div>
                <h1 className="text-2xl font-bold mb-2">주문이 접수되었습니다</h1>
                <p className="text-gray-600 mb-6">
                    결제가 승인되었고 매장에서 주문을 확인할 예정입니다.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">주문번호</span>
                        <span className="font-bold">{orderNumber}</span>
                    </div>
                    <div className="flex justify-between mb-2 gap-4">
                        <span className="text-gray-500">배달 주소</span>
                        <span className="font-medium text-sm text-right">
                            {deliveryInfo.address?.address || '-'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">예상 배달 시간</span>
                        <span className="font-medium">{store.estimatedDeliveryMinutes || 40}분</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => { if (confirmedOrderId) router.push(`/orders/${confirmedOrderId}`); }}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold"
                    >
                        주문 상세 보기
                    </button>
                    <button
                        onClick={() => router.push(`/store/${storeId}/menu`)}
                        className="w-full border-2 border-gray-200 p-4 rounded-xl font-bold"
                    >
                        더 주문하기
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

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-yellow mx-auto mb-4" />
                    <p className="text-lg font-medium">로딩 중...</p>
                </div>
            </main>
        }>
            <SuccessContent />
        </Suspense>
    );
}
