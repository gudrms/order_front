'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ChevronLeft, Receipt, XCircle } from 'lucide-react';
import { OrderStatusTracker } from '@/components/order/OrderStatusTracker';
import { useCancelOrder, useOrder } from '@/hooks/queries/useOrders';
import { useAuth } from '@/contexts/AuthContext';

function OrderDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { user, loading: isAuthLoading } = useAuth();
    const { data: order, isLoading } = useOrder(id, user?.id);
    const cancelOrder = useCancelOrder(id, user?.id);
    const [cancelError, setCancelError] = useState<string | null>(null);

    if (isAuthLoading) {
        return <LoadingScreen />;
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
        return <LoadingScreen />;
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p>주문을 찾을 수 없습니다.</p>
            </main>
        );
    }

    const canCancelBeforePayment =
        (order.status === 'PENDING_PAYMENT' || order.status === 'PENDING') &&
        order.paymentStatus !== 'PAID';
    const isPaidOrder = order.paymentStatus === 'PAID';
    const isCancelled = order.status === 'CANCELLED';

    const handleCancel = () => {
        setCancelError(null);
        const reason = window.prompt('취소 사유를 입력해주세요.', '주문을 잘못 선택했습니다.');
        if (reason === null) {
            return;
        }

        cancelOrder.mutate(reason.trim() || undefined, {
            onError: (error) => {
                setCancelError(error instanceof Error ? error.message : '주문 취소에 실패했습니다.');
            },
        });
    };

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

                {isCancelled && (
                    <section className="bg-red-50 rounded-xl p-4 border border-red-100 text-red-700">
                        <div className="flex items-center gap-2 font-bold">
                            <XCircle size={20} />
                            주문이 취소되었습니다
                        </div>
                        {order.cancelReason && (
                            <p className="mt-2 text-sm">사유: {order.cancelReason}</p>
                        )}
                    </section>
                )}

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
                                    <p className="text-sm text-gray-500">{item.quantity}개</p>
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
                        <InfoRow label="주문번호" value={order.orderNumber} />
                        <InfoRow label="주문일시" value={new Date(order.createdAt).toLocaleString('ko-KR')} />
                        <InfoRow label="주문상태" value={order.status} />
                        <InfoRow label="결제상태" value={order.paymentStatus || '-'} />
                        {order.cancelledAt && (
                            <InfoRow label="취소일시" value={new Date(order.cancelledAt).toLocaleString('ko-KR')} />
                        )}
                        {order.delivery && (
                            <>
                                <InfoRow label="수령자" value={order.delivery.recipientName} />
                                <InfoRow label="연락처" value={order.delivery.recipientPhone} />
                                <InfoRow
                                    label="주소"
                                    value={`${order.delivery.address}${order.delivery.detailAddress ? ` ${order.delivery.detailAddress}` : ''}`}
                                />
                                {order.delivery.deliveryMemo && (
                                    <InfoRow label="요청사항" value={order.delivery.deliveryMemo} />
                                )}
                            </>
                        )}
                    </div>
                </section>

                {!isCancelled && (
                    <section className="bg-white rounded-xl p-4 space-y-3 shadow-sm border border-gray-100">
                        <h2 className="font-bold text-lg">주문 취소</h2>
                        {canCancelBeforePayment ? (
                            <>
                                <p className="text-sm text-gray-500">
                                    결제 승인 전 주문은 앱에서 바로 취소할 수 있습니다.
                                </p>
                                {cancelError && (
                                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                        {cancelError}
                                    </p>
                                )}
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelOrder.isPending}
                                    className="w-full rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-600 disabled:opacity-60"
                                >
                                    {cancelOrder.isPending ? '취소 처리 중...' : '주문 취소하기'}
                                </button>
                            </>
                        ) : (
                            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-100">
                                <div className="mb-1 flex items-center gap-2 font-bold">
                                    <AlertTriangle size={18} />
                                    {isPaidOrder ? '결제 완료 주문입니다' : '앱에서 바로 취소할 수 없는 상태입니다'}
                                </div>
                                <p>
                                    결제 승인 이후 취소/환불은 매장 확인과 결제 취소 처리가 필요합니다.
                                    관리자 환불 기능이 연결되기 전까지는 매장에 문의해주세요.
                                </p>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-right">{value}</span>
        </div>
    );
}

function LoadingScreen() {
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
        </main>
    );
}

export default function OrderDetailPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <OrderDetailContent />
        </Suspense>
    );
}
