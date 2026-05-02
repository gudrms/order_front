'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CreditCard, Tag, X } from 'lucide-react';
import { calculateCouponDiscount, generateOrderId, useCartStore } from '@order/shared';

// SSR에서 window.location 참조로 인한 ReferenceError 방지
// @order/ui 배럴을 통하면 @tosspayments/payment-widget-sdk 가 SSR 번들에 포함되므로
// payment 서브패스로 직접 import
const TossPaymentWidget = dynamic(
    () => import('@order/ui/payment').then((m) => ({ default: m.TossPaymentWidget })),
    { ssr: false },
);
import type { CreateOrderRequest, OrderItemInput, UserCoupon } from '@order/shared';
import type { PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentStore } from '@/contexts/StoreContext';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useCreateOrder } from '@/hooks/mutations/useCreateOrder';
import { useFailTossPayment } from '@/hooks/mutations/useFailTossPayment';
import { useAddresses } from '@/hooks/queries/useAddresses';
import { useAvailableCoupons } from '@/hooks/queries/useCoupons';

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
    const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);
    const [showCouponSheet, setShowCouponSheet] = useState(false);
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);

    const { data: availableCoupons = [] } = useAvailableCoupons(user?.id);

    const totalAmount = orderTotal(totalPrice);
    const deliveryFee = totalAmount - totalPrice;
    const discountAmount = selectedCoupon
        ? calculateCouponDiscount(selectedCoupon.coupon, totalAmount)
        : 0;
    const paymentAmount = totalAmount - discountAmount;
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
            totalAmount,           // 쿠폰 적용 전 금액 (백엔드 메뉴 금액 검증용)
            userCouponId: selectedCoupon?.id,
            payment: {
                orderId,
                amount: paymentAmount, // 쿠폰 할인 후 실결제 금액
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
                successUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/order/success`,
                failUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/order/fail`,
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
                        amount={paymentAmount}
                        onWidgetReady={(widget) => {
                            paymentWidgetRef.current = widget;
                        }}
                    />
                </section>

                {/* 쿠폰 선택 */}
                <section className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Tag size={18} className="text-purple-500" />
                            <h2 className="font-bold text-base">쿠폰</h2>
                            {availableCoupons.length > 0 && (
                                <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                                    {availableCoupons.length}장 보유
                                </span>
                            )}
                        </div>
                        {selectedCoupon ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-purple-600">
                                    -{discountAmount.toLocaleString()}원
                                </span>
                                <button
                                    onClick={() => setSelectedCoupon(null)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                    aria-label="쿠폰 제거"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => availableCoupons.length > 0 && setShowCouponSheet(true)}
                                className={`flex items-center gap-1 text-sm font-medium ${availableCoupons.length > 0 ? 'text-purple-600' : 'text-gray-400'}`}
                            >
                                {availableCoupons.length > 0 ? '선택' : '없음'}
                                {availableCoupons.length > 0 && <ChevronRight size={16} />}
                            </button>
                        )}
                    </div>
                    {selectedCoupon && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm font-semibold text-purple-700">{selectedCoupon.coupon.name}</p>
                            <p className="text-xs text-purple-500 mt-0.5">
                                {selectedCoupon.coupon.type === 'PERCENTAGE'
                                    ? `${selectedCoupon.coupon.discountValue}% 할인${selectedCoupon.coupon.maxDiscountAmount ? ` (최대 ${selectedCoupon.coupon.maxDiscountAmount.toLocaleString()}원)` : ''}`
                                    : `${selectedCoupon.coupon.discountValue.toLocaleString()}원 할인`}
                                {' · '}만료 {new Date(selectedCoupon.expiresAt).toLocaleDateString('ko-KR')}
                            </p>
                        </div>
                    )}
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
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-purple-600">
                                <span>쿠폰 할인</span>
                                <span className="font-semibold">-{discountAmount.toLocaleString()}원</span>
                            </div>
                        )}
                        <div className="h-px bg-gray-200 my-2" />
                        <div className="flex justify-between text-lg">
                            <span className="font-bold">총 결제 금액</span>
                            <span className="font-bold text-brand-yellow">
                                {paymentAmount.toLocaleString()}원
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
                                : `${paymentAmount.toLocaleString()}원 결제하기`}
                    </button>
                </div>
            </div>

            {/* 쿠폰 선택 바텀시트 */}
            {showCouponSheet && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowCouponSheet(false)}
                    />
                    <div className="relative bg-white rounded-t-2xl max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-lg">쿠폰 선택</h3>
                            <button
                                onClick={() => setShowCouponSheet(false)}
                                className="p-2 text-gray-400"
                                aria-label="닫기"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3">
                            {availableCoupons.map((uc) => {
                                const discount = calculateCouponDiscount(uc.coupon, totalAmount);
                                const isDisabled = uc.coupon.minOrderAmount != null && totalAmount < uc.coupon.minOrderAmount;
                                return (
                                    <button
                                        key={uc.id}
                                        disabled={isDisabled}
                                        onClick={() => {
                                            setSelectedCoupon(uc);
                                            setShowCouponSheet(false);
                                        }}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                                            isDisabled
                                                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                                : selectedCoupon?.id === uc.id
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-100 hover:border-purple-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-sm">{uc.coupon.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {uc.coupon.type === 'PERCENTAGE'
                                                        ? `${uc.coupon.discountValue}% 할인${uc.coupon.maxDiscountAmount ? ` (최대 ${uc.coupon.maxDiscountAmount.toLocaleString()}원)` : ''}`
                                                        : `${uc.coupon.discountValue.toLocaleString()}원 할인`}
                                                </p>
                                                {uc.coupon.minOrderAmount && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        최소 주문 {uc.coupon.minOrderAmount.toLocaleString()}원 이상
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    만료: {new Date(uc.expiresAt).toLocaleDateString('ko-KR')}
                                                </p>
                                            </div>
                                            {!isDisabled && (
                                                <span className="text-purple-600 font-bold text-sm flex-shrink-0 ml-2">
                                                    -{discount.toLocaleString()}원
                                                </span>
                                            )}
                                        </div>
                                        {isDisabled && (
                                            <p className="text-xs text-red-400 mt-1">
                                                최소 주문금액 {uc.coupon.minOrderAmount!.toLocaleString()}원 미달
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
