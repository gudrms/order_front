'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard } from 'lucide-react';
import { TossPaymentWidget } from '@order/ui';
import { generateOrderId, useCartStore } from '@order/shared';
import type { CreateOrderRequest, OrderItemInput } from '@order/shared';
import type { PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentStore } from '@/contexts/StoreContext';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useCreateOrder } from '@/hooks/mutations/useCreateOrder';
import { useFailTossPayment } from '@/hooks/mutations/useFailTossPayment';
import { useAddresses } from '@/hooks/queries/useAddresses';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
const PENDING_TOSS_ORDER_ID_KEY = 'delivery.pendingTossOrderId';

export default function CheckoutPage() {
    const router = useRouter();
    const { store, storeId, isLoading: isStoreLoading, orderTotal } = useCurrentStore();
    const { user, loading: isAuthLoading } = useAuth();
    const { items, totalPrice } = useCartStore();
    const { deliveryInfo, setAddress, setCustomerInfo, setDeliveryRequest } = useDeliveryStore();
    const { data: addresses = [] } = useAddresses(user?.id);
    const createOrderMutation = useCreateOrder();
    const failTossPaymentMutation = useFailTossPayment();

    const [isProcessing, setIsProcessing] = useState(false);
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);

    const totalAmount = orderTotal(totalPrice);
    const deliveryFee = totalAmount - totalPrice;
    const isBelowMinimum = !!store && totalPrice < store.minimumOrderAmount;
    const canOrder = !!storeId
        && !!user
        && !!store?.isActive
        && !!store?.isDeliveryEnabled
        && !isBelowMinimum
        && !!deliveryInfo.customerName
        && !!deliveryInfo.customerPhone
        && !!deliveryInfo.address?.address
        && items.length > 0
        && !isProcessing;
    const isPaymentButtonDisabled = user ? !canOrder : isAuthLoading || isProcessing;

    useEffect(() => {
        if (deliveryInfo.address?.address || addresses.length === 0) return;

        const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];
        setAddress({
            id: defaultAddress.id,
            name: defaultAddress.name,
            address: defaultAddress.address,
            detailAddress: defaultAddress.detailAddress || undefined,
            zipCode: defaultAddress.zipCode || undefined,
        });
        if (defaultAddress.recipientName || defaultAddress.recipientPhone) {
            setCustomerInfo(defaultAddress.recipientName || '', defaultAddress.recipientPhone || '');
        }
        if (defaultAddress.deliveryMemo) {
            setDeliveryRequest(defaultAddress.deliveryMemo);
        }
    }, [addresses, deliveryInfo.address?.address, setAddress, setCustomerInfo, setDeliveryRequest]);

    if (items.length === 0) {
        router.push('/menu');
        return null;
    }

    const buildOrderRequest = (orderId: string): CreateOrderRequest => {
        const orderItems: OrderItemInput[] = items.map((item) => ({
            menuId: item.menuId,
            menuName: item.menuName,
            quantity: item.quantity,
            price: item.unitPrice,
            options: (item.options || []).map((option) => ({
                optionId: option.itemId,
                name: option.itemName,
                price: option.price,
            })),
        }));

        return {
            storeId: storeId!,
            userId: user?.id,
            delivery: {
                recipientName: deliveryInfo.customerName || '',
                recipientPhone: deliveryInfo.customerPhone || '',
                address: deliveryInfo.address?.address || '',
                detailAddress: deliveryInfo.address?.detailAddress,
                zipCode: deliveryInfo.address?.zipCode,
                deliveryMemo: deliveryInfo.deliveryRequest,
                addressId: deliveryInfo.address?.id,
            },
            items: orderItems,
            totalAmount,
            payment: {
                orderId,
                amount: totalAmount,
                paymentType: 'NORMAL',
                method: 'TOSS',
            },
        };
    };

    const reportPaymentAbort = async (orderId: string, error: unknown) => {
        try {
            await failTossPaymentMutation.mutateAsync({
                orderId,
                code: 'PAYMENT_WIDGET_ABORTED',
                message: error instanceof Error ? error.message : '결제창이 완료되지 않았습니다.',
            });
        } catch (reportError) {
            console.error('결제 실패 기록 중 오류:', reportError);
        }
    };

    const handlePayment = async () => {
        if (!canOrder) return;

        let pendingTossOrderId: string | null = null;

        try {
            setIsProcessing(true);
            const orderId = generateOrderId();
            const orderRequest = buildOrderRequest(orderId);
            const paymentWidget = paymentWidgetRef.current;

            if (!paymentWidget) {
                alert('결제 위젯이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');
                return;
            }

            await createOrderMutation.mutateAsync(orderRequest);
            pendingTossOrderId = orderId;
            sessionStorage.setItem(PENDING_TOSS_ORDER_ID_KEY, orderId);

            await paymentWidget.requestPayment({
                orderId,
                orderName: items.length > 1
                    ? `${items[0].menuName} 외 ${items.length - 1}건`
                    : items[0].menuName,
                customerName: deliveryInfo.customerName,
                customerEmail: user?.email || undefined,
                successUrl: `${window.location.origin}/order/success`,
                failUrl: `${window.location.origin}/order/fail`,
            });
        } catch (error) {
            console.error('결제 요청 오류:', error);
            if (pendingTossOrderId) {
                await reportPaymentAbort(pendingTossOrderId, error);
                sessionStorage.removeItem(PENDING_TOSS_ORDER_ID_KEY);
            }
            alert(error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    const disabledReason = (() => {
        if (isStoreLoading) return '매장 정보를 불러오는 중입니다.';
        if (isAuthLoading) return '로그인 상태를 확인하는 중입니다.';
        if (!user) return '배달 주문은 로그인 후 이용할 수 있습니다.';
        if (!store) return '매장 정보를 찾을 수 없습니다.';
        if (!store.isActive) return '현재 운영하지 않는 매장입니다.';
        if (!store.isDeliveryEnabled) return '현재 배달 주문을 받지 않는 매장입니다.';
        if (isBelowMinimum) return `최소 주문금액은 ${store.minimumOrderAmount.toLocaleString()}원입니다.`;
        if (!deliveryInfo.address?.address) return '배달 주소를 입력해 주세요.';
        if (!deliveryInfo.customerName || !deliveryInfo.customerPhone) return '주문자 정보를 입력해 주세요.';
        return null;
    })();

    return (
        <main className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-brand-black"
                        aria-label="이전 페이지"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">결제하기</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-[568px] mx-auto p-4 space-y-4 pb-36">
                <section className="bg-white rounded-xl p-4 space-y-2">
                    <p className="text-sm text-gray-500">주문 매장</p>
                    <h2 className="font-bold text-lg">{store?.name || '매장 확인 중'}</h2>
                    {disabledReason && (
                        <p className="text-sm text-red-500">{disabledReason}</p>
                    )}
                </section>

                <section className="bg-white rounded-xl p-4 space-y-3">
                    <h2 className="font-bold text-lg">배달 정보</h2>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-gray-500">주소</span>
                            <p className="font-medium mt-1">
                                {deliveryInfo.address?.address || '주소를 입력해 주세요'}
                                {deliveryInfo.address?.detailAddress && (
                                    <>
                                        <br />
                                        {deliveryInfo.address.detailAddress}
                                    </>
                                )}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500">주문자</span>
                            <span className="font-medium ml-2">{deliveryInfo.customerName || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">연락처</span>
                            <span className="font-medium ml-2">{deliveryInfo.customerPhone || '-'}</span>
                        </div>
                        {deliveryInfo.deliveryRequest && (
                            <div>
                                <span className="text-gray-500">요청사항</span>
                                <p className="font-medium mt-1">{deliveryInfo.deliveryRequest}</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-xl p-4 space-y-3">
                    <h2 className="font-bold text-lg">주문 내역</h2>
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm gap-4">
                                <div>
                                    <p className="font-medium">{item.menuName}</p>
                                    {item.options && item.options.length > 0 && (
                                        <p className="text-gray-500 text-xs">
                                            {item.options.map((option) => option.itemName).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-medium">{item.totalPrice.toLocaleString()}원</p>
                                    <p className="text-gray-500 text-xs">수량: {item.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white rounded-xl p-4 space-y-3">
                    <h2 className="font-bold text-lg">결제 방법</h2>
                    <div className="w-full p-4 rounded-xl border-2 border-brand-yellow bg-brand-yellow/10 flex items-center gap-3">
                        <CreditCard size={24} />
                        <span className="font-medium">토스페이먼츠 카드 결제</span>
                    </div>
                    <TossPaymentWidget
                        clientKey={TOSS_CLIENT_KEY}
                        customerKey={user?.id || 'ANONYMOUS'}
                        amount={totalAmount}
                        onWidgetReady={(widget) => {
                            paymentWidgetRef.current = widget;
                        }}
                    />
                </section>

                <section className="bg-white rounded-xl p-4 space-y-3">
                    <h2 className="font-bold text-lg">결제 금액</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">주문 금액</span>
                            <span className="font-medium">{totalPrice.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">배달비</span>
                            <span className="font-medium">{deliveryFee.toLocaleString()}원</span>
                        </div>
                        <div className="h-px bg-gray-200 my-2" />
                        <div className="flex justify-between text-lg">
                            <span className="font-bold">총 결제 금액</span>
                            <span className="font-bold text-brand-yellow">
                                {totalAmount.toLocaleString()}원
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8">
                <div className="max-w-[568px] mx-auto space-y-2">
                    {disabledReason && (
                        <p className="text-center text-sm text-red-500">{disabledReason}</p>
                    )}
                    <button
                        onClick={user ? handlePayment : () => router.push('/login')}
                        disabled={isPaymentButtonDisabled}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {!user
                            ? '로그인하고 주문하기'
                            : isProcessing
                                ? '처리 중...'
                                : `${totalAmount.toLocaleString()}원 결제하기`}
                    </button>
                </div>
            </div>
        </main>
    );
}
