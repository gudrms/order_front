'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, DollarSign } from 'lucide-react';
import { useCartStore, generateOrderId } from '@order/shared';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useCreateOrder } from '@/hooks/mutations/useCreateOrder';
import type { CreateOrderRequest, OrderItemInput } from '@order/shared';
import { TossPaymentWidget } from '@order/ui';
import type { PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, clearCart } = useCartStore();
    const { deliveryInfo } = useDeliveryStore();
    const createOrderMutation = useCreateOrder();

    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CARD');
    const [isProcessing, setIsProcessing] = useState(false);
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);

    // 장바구니가 비어있으면 메뉴 페이지로 리다이렉트
    if (items.length === 0) {
        router.push('/menu');
        return null;
    }

    const handlePayment = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);

            // 주문 ID 생성
            const orderId = generateOrderId();

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

            // 토스페이먼츠 결제 요청
            if (paymentMethod === 'CARD') {
                const paymentWidget = paymentWidgetRef.current;
                if (!paymentWidget) {
                    alert('결제 위젯이 로드되지 않았습니다.');
                    return;
                }

                await paymentWidget.requestPayment({
                    orderId: orderId,
                    orderName: `${items[0].menuName} 외 ${items.length - 1}건`,
                    customerName: deliveryInfo.customerName,
                    customerEmail: deliveryInfo.customerPhone ? undefined : undefined, // 이메일 정보가 없으면 생략
                    successUrl: `${window.location.origin}/order/success`,
                    failUrl: `${window.location.origin}/order/fail`,
                });

                // 토스페이먼츠가 리다이렉트하므로 여기서는 주문 생성하지 않음
                // success 페이지에서 처리
            } else {
                // 만나서 결제 (현금)
                const orderRequest: CreateOrderRequest = {
                    storeId: 'store-1', // TODO: 실제 매장 ID
                    items: orderItems,
                    totalAmount: totalPrice,
                    payment: {
                        orderId: orderId,
                        amount: totalPrice,
                        paymentKey: 'CASH_' + orderId,
                        paymentType: 'NORMAL',
                    },
                };

                const result = await createOrderMutation.mutateAsync(orderRequest);

                // 장바구니 비우기
                clearCart();

                // 주문 완료 페이지로 이동
                router.push(`/order/complete?orderNumber=${result.orderNumber}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
            // alert('결제 처리 중 오류가 발생했습니다.'); // 위젯 내부 에러 처리가 있을 수 있음
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-brand-black"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">결제하기</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-[568px] mx-auto p-4 space-y-4">
                {/* 배달 정보 */}
                <section className="bg-white rounded-xl p-4 space-y-3">
                    <h2 className="font-bold text-lg">배달 정보</h2>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-gray-500">주소:</span>
                            <p className="font-medium mt-1">
                                {deliveryInfo.address?.address}
                                <br />
                                {deliveryInfo.address?.detailAddress}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500">주문자:</span>
                            <span className="font-medium ml-2">{deliveryInfo.customerName}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">연락처:</span>
                            <span className="font-medium ml-2">{deliveryInfo.customerPhone}</span>
                        </div>
                        {deliveryInfo.deliveryRequest && (
                            <div>
                                <span className="text-gray-500">요청사항:</span>
                                <p className="font-medium mt-1">{deliveryInfo.deliveryRequest}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* 주문 내역 */}
                <section className="bg-white rounded-xl p-4 space-y-3">
                    <h2 className="font-bold text-lg">주문 내역</h2>
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                    <p className="font-medium">{item.menuName}</p>
                                    {item.options && item.options.length > 0 && (
                                        <p className="text-gray-500 text-xs">
                                            {item.options.map(opt => opt.itemName).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{item.totalPrice.toLocaleString()}원</p>
                                    <p className="text-gray-500 text-xs">수량: {item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 결제 방법 선택 */}
                <section className="bg-white rounded-xl p-4 space-y-3">
                    <h2 className="font-bold text-lg">결제 방법</h2>
                    <div className="space-y-2">
                        <button
                            onClick={() => setPaymentMethod('CARD')}
                            className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${paymentMethod === 'CARD'
                                    ? 'border-brand-yellow bg-brand-yellow/10'
                                    : 'border-gray-200'
                                }`}
                        >
                            <CreditCard size={24} />
                            <span className="font-medium">온라인 결제 (카드/간편결제)</span>
                        </button>

                        {/* 토스 결제 위젯 */}
                        <div className={`transition-all duration-300 overflow-hidden ${paymentMethod === 'CARD' ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <TossPaymentWidget
                                clientKey={TOSS_CLIENT_KEY}
                                customerKey={deliveryInfo.customerPhone || "ANONYMOUS"} // 고객 식별키 (전화번호 사용)
                                amount={totalPrice}
                                onWidgetReady={(widget) => {
                                    paymentWidgetRef.current = widget;
                                }}
                            />
                        </div>

                        <button
                            onClick={() => setPaymentMethod('CASH')}
                            className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${paymentMethod === 'CASH'
                                    ? 'border-brand-yellow bg-brand-yellow/10'
                                    : 'border-gray-200'
                                }`}
                        >
                            <DollarSign size={24} />
                            <span className="font-medium">만나서 결제 (현금)</span>
                        </button>
                    </div>
                </section>

                {/* 결제 금액 */}
                <section className="bg-white rounded-xl p-4 space-y-3">
                    <h2 className="font-bold text-lg">결제 금액</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">주문 금액</span>
                            <span className="font-medium">{totalPrice.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">배달비</span>
                            <span className="font-medium">0원</span>
                        </div>
                        <div className="h-px bg-gray-200 my-2" />
                        <div className="flex justify-between text-lg">
                            <span className="font-bold">총 결제 금액</span>
                            <span className="font-bold text-brand-yellow">
                                {totalPrice.toLocaleString()}원
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            {/* 결제 버튼 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8">
                <div className="max-w-[568px] mx-auto">
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing
                            ? '처리 중...'
                            : paymentMethod === 'CARD'
                                ? `${totalPrice.toLocaleString()}원 결제하기`
                                : `${totalPrice.toLocaleString()}원 주문하기`}
                    </button>
                </div>
            </div>
        </main>
    );
}
