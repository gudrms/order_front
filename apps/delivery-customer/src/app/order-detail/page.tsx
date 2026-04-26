'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Receipt } from 'lucide-react';
import { OrderStatusTracker } from '@/components/order/OrderStatusTracker';
import { useOrder } from '@/hooks/queries/useOrders';
import { useAuth } from '@/contexts/AuthContext';

function OrderDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { user, loading: isAuthLoading } = useAuth();
    const { data: order, isLoading } = useOrder(id, user?.id);

    if (isAuthLoading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-sm w-full rounded-xl bg-white p-6 text-center shadow-sm border border-gray-100">
                    <h1 className="text-lg font-bold mb-2">로그인이 필요합니다</h1>
                    <p className="text-sm text-gray-500 mb-6">
                        주문 상세와 배달 현황은 로그인 후 확인할 수 있습니다.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold"
                    >
                        로그인하러 가기
                    </button>
                </div>
            </main>
        );
    }

    if (isLoading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p>주문을 찾을 수 없습니다.</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-brand-black"
                        aria-label="이전 페이지"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">주문 상세</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-[568px] mx-auto p-4 space-y-4">
                <OrderStatusTracker orderId={order.id} initialStatus={order.status} userId={user.id} />

                <section className="bg-white rounded-xl p-4 space-y-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                        <Receipt className="text-brand-yellow" size={24} />
                        <h2 className="font-bold text-lg">주문 내역</h2>
                    </div>

                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between gap-4">
                                <div>
                                    <p className="font-medium">{item.menuName}</p>
                                    {item.options?.map((option) => (
                                        <p key={option.optionGroupId} className="text-sm text-gray-500">
                                            {option.items.map((optionItem) => optionItem.name).join(', ')}
                                        </p>
                                    ))}
                                    <p className="text-sm text-gray-500">
                                        {item.quantity}개
                                    </p>
                                </div>
                                <p className="font-medium flex-shrink-0">
                                    {item.totalPrice.toLocaleString()}원
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">배달비</span>
                            <span>{(order.delivery?.deliveryFee || 0).toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>총 결제 금액</span>
                            <span className="text-brand-yellow">
                                {order.totalAmount.toLocaleString()}원
                            </span>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-xl p-4 space-y-4 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-lg">배달 정보</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">주문번호</span>
                            <span className="font-medium">{order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">주문일시</span>
                            <span className="font-medium">
                                {new Date(order.createdAt).toLocaleString('ko-KR')}
                            </span>
                        </div>
                        {order.delivery && (
                            <>
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">수령자</span>
                                    <span className="font-medium">{order.delivery.recipientName}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">연락처</span>
                                    <span className="font-medium">{order.delivery.recipientPhone}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">주소</span>
                                    <span className="font-medium text-right">
                                        {order.delivery.address}
                                        {order.delivery.detailAddress ? ` ${order.delivery.detailAddress}` : ''}
                                    </span>
                                </div>
                                {order.delivery.deliveryMemo && (
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-500">요청사항</span>
                                        <span className="font-medium text-right">{order.delivery.deliveryMemo}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default function OrderDetailPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </main>
        }>
            <OrderDetailContent />
        </Suspense>
    );
}
