'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronLeft, Receipt, X, XCircle } from 'lucide-react';
import { OrderDetailSkeleton } from '@/components/ui/Skeleton';
import { OrderStatusTracker } from '@/components/order/OrderStatusTracker';
import { useCancelOrder, useOrder } from '@/hooks/queries/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import type { DeliveryStatus, OrderStatus } from '@order/shared';

const orderStatusLabel: Record<OrderStatus, string> = {
    PENDING: '접수 대기',
    PENDING_PAYMENT: '결제 대기',
    PAID: '결제 완료',
    CONFIRMED: '주문 접수',
    COOKING: '조리 중',
    PREPARING: '준비 중',
    READY: '배달 준비',
    DELIVERING: '배달 중',
    COMPLETED: '완료',
    CANCELLED: '취소',
};

const deliveryStatusLabel: Record<DeliveryStatus, string> = {
    PENDING: '배달 대기',
    ASSIGNED: '라이더 배정',
    PICKED_UP: '픽업 완료',
    DELIVERING: '배달 중',
    DELIVERED: '배달 완료',
    FAILED: '배달 실패',
    CANCELLED: '배달 취소',
};

const CANCEL_REASONS = [
    '주문을 잘못 선택했습니다.',
    '배달 주소를 변경하고 싶습니다.',
    '단순 변심입니다.',
    '직접 입력',
];

function CancelModal({
    isPending,
    onConfirm,
    onClose,
}: {
    isPending: boolean;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}) {
    const [selected, setSelected] = useState(CANCEL_REASONS[0]);
    const [custom, setCustom] = useState('');
    const isCustom = selected === '직접 입력';
    const finalReason = isCustom ? custom.trim() : selected;

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/40"
                onClick={onClose}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white px-5 pb-8 pt-5 shadow-xl max-w-[568px] mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">주문 취소</h2>
                    <button onClick={onClose} className="p-1 text-gray-400">
                        <X size={22} />
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">취소 사유를 선택해주세요.</p>

                <div className="space-y-2 mb-4">
                    {CANCEL_REASONS.map((reason) => (
                        <button
                            key={reason}
                            onClick={() => setSelected(reason)}
                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                                selected === reason
                                    ? 'border-red-400 bg-red-50 text-red-700'
                                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {reason}
                        </button>
                    ))}
                </div>

                {isCustom && (
                    <textarea
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        placeholder="취소 사유를 직접 입력하세요."
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm resize-none h-24 mb-4 focus:outline-none focus:border-red-400"
                        autoFocus
                    />
                )}

                <button
                    onClick={() => onConfirm(finalReason)}
                    disabled={isPending || (isCustom && !custom.trim())}
                    className="w-full rounded-xl bg-red-500 py-4 font-bold text-white disabled:opacity-60"
                >
                    {isPending ? '취소 처리 중...' : '주문 취소하기'}
                </button>
            </div>
        </>
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

function OrderDetailContent({ orderId }: { orderId: string }) {
    const router = useRouter();
    const { user, loading: isAuthLoading } = useAuth();
    const { data: order, isLoading } = useOrder(orderId, user?.id);
    const cancelOrder = useCancelOrder(orderId, user?.id);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    if (isAuthLoading || isLoading) {
        return (
            <main className="min-h-screen bg-gray-50 pb-20">
                <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between px-4 h-14">
                        <ChevronLeft size={24} className="text-gray-300" />
                        <div className="w-20 h-5 rounded bg-gray-200 animate-pulse" />
                        <div className="w-10" />
                    </div>
                </header>
                <OrderDetailSkeleton />
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
    const isCancelled = order.status === 'CANCELLED' || order.delivery?.status === 'CANCELLED';

    const handleConfirmCancel = (reason: string) => {
        setCancelError(null);
        cancelOrder.mutate(reason || undefined, {
            onSuccess: () => setShowCancelModal(false),
            onError: (error) => {
                setShowCancelModal(false);
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
                <OrderStatusTracker
                    orderId={order.id}
                    initialStatus={order.status}
                    deliveryStatus={order.delivery?.status}
                    userId={user.id}
                />

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
                        <InfoRow label="주문상태" value={orderStatusLabel[order.status] || order.status} />
                        <InfoRow label="결제상태" value={order.paymentStatus || '-'} />
                        {order.cancelledAt && (
                            <InfoRow label="취소일시" value={new Date(order.cancelledAt).toLocaleString('ko-KR')} />
                        )}
                        {order.delivery && (
                            <>
                                <InfoRow label="배달상태" value={deliveryStatusLabel[order.delivery.status] || order.delivery.status} />
                                <InfoRow label="수령자" value={order.delivery.recipientName} />
                                <InfoRow label="연락처" value={order.delivery.recipientPhone} />
                                <InfoRow
                                    label="주소"
                                    value={`${order.delivery.address}${order.delivery.detailAddress ? ` ${order.delivery.detailAddress}` : ''}`}
                                />
                                {order.delivery.riderMemo && (
                                    <InfoRow label="라이더 메모" value={order.delivery.riderMemo} />
                                )}
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
                                    onClick={() => setShowCancelModal(true)}
                                    className="w-full rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-600"
                                >
                                    주문 취소하기
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

            {showCancelModal && (
                <CancelModal
                    isPending={cancelOrder.isPending}
                    onConfirm={handleConfirmCancel}
                    onClose={() => setShowCancelModal(false)}
                />
            )}
        </main>
    );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <OrderDetailContent orderId={id} />;
}
