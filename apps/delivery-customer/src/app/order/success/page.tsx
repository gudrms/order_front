'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@order/shared';
import { useCreateOrder } from '@/hooks/mutations/useCreateOrder';
import { useDeliveryStore } from '@/stores/deliveryStore';
import type { CreateOrderRequest, OrderItemInput } from '@order/shared';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { items, clearCart } = useCartStore();
    const { deliveryInfo } = useDeliveryStore();
    const createOrderMutation = useCreateOrder();

    const [isProcessing, setIsProcessing] = useState(true);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processPayment = async () => {
            const orderId = searchParams.get('orderId');
            const paymentKey = searchParams.get('paymentKey');
            const amount = searchParams.get('amount');

            if (!orderId || !paymentKey || !amount) {
                setError('결제 정보가 올바르지 않습니다.');
                setIsProcessing(false);
                return;
            }

            try {
                // 주문 아이템 변환
                const orderItems: OrderItemInput[] = items.map((item) => ({
                    menuId: item.menuId,
                    menuName: item.menuName,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    options: (item.options || []).map((opt) => ({
                        name: opt.itemName,
                        price: opt.price,
                    })),
                }));

                // 주문 생성 API 호출
                const orderRequest: CreateOrderRequest = {
                    storeId: 'store-1', // TODO: 실제 매장 ID
                    items: orderItems,
                    totalAmount: parseInt(amount),
                    payment: {
                        orderId: orderId,
                        amount: parseInt(amount),
                        paymentKey: paymentKey,
                        paymentType: 'NORMAL',
                    },
                };

                const result = await createOrderMutation.mutateAsync(orderRequest);

                // 장바구니 비우기
                clearCart();

                setOrderNumber(result.orderNumber);
            } catch (err) {
                console.error('Order creation error:', err);
                setError('주문 처리 중 오류가 발생했습니다.');
            } finally {
                setIsProcessing(false);
            }
        };

        processPayment();
    }, [searchParams, items, createOrderMutation, clearCart]);

    if (isProcessing) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-yellow mx-auto mb-4" />
                    <p className="text-lg font-medium">결제를 처리하고 있습니다...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold mb-2">결제 실패</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/menu')}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold"
                    >
                        메뉴로 돌아가기
                    </button>
                </div>
            </main>
        );
    }

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

                <div className="space-y-2">
                    <button
                        onClick={() => {
                            const orderId = searchParams.get('orderId');
                            if (orderId) router.push(`/order-detail?id=${orderId}`);
                        }}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold"
                    >
                        주문 상세 보기
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
