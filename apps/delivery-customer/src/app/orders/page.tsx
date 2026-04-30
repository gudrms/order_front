'use client';

import { CheckCircle, ChevronLeft, Clock, Loader, LockKeyhole, XCircle } from 'lucide-react';
import { OrdersPageSkeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentStore } from '@/contexts/StoreContext';
import { useOrders } from '@/hooks/queries/useOrders';
import type { OrderStatus } from '@order/shared';

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; color: string }> = {
    PENDING: { label: '접수 대기', icon: Clock, color: 'text-gray-500' },
    PENDING_PAYMENT: { label: '결제 대기', icon: Clock, color: 'text-slate-500' },
    CONFIRMED: { label: '접수 완료', icon: CheckCircle, color: 'text-blue-500' },
    PAID: { label: '결제 완료', icon: CheckCircle, color: 'text-blue-500' },
    COOKING: { label: '조리 중', icon: Loader, color: 'text-orange-500' },
    PREPARING: { label: '준비 중', icon: Loader, color: 'text-orange-500' },
    READY: { label: '준비 완료', icon: CheckCircle, color: 'text-green-500' },
    DELIVERING: { label: '배달 중', icon: Loader, color: 'text-purple-500' },
    COMPLETED: { label: '완료', icon: CheckCircle, color: 'text-green-600' },
    CANCELLED: { label: '취소됨', icon: XCircle, color: 'text-red-500' },
};

const paymentStatusBadge: Record<string, { label: string; className: string }> = {
    REFUNDED: { label: '환불 완료', className: 'bg-gray-100 text-gray-600' },
    PARTIAL_REFUNDED: { label: '부분 환불', className: 'bg-orange-100 text-orange-700' },
    CANCELLED: { label: '결제 취소', className: 'bg-red-100 text-red-600' },
};

export default function OrdersPage() {
    const router = useRouter();
    const { user, loading: isAuthLoading } = useAuth();
    const { storeId } = useCurrentStore();
    const { data, isLoading, isError } = useOrders({ storeId, userId: user?.id });
    const orders = data?.orders || [];

    if (isAuthLoading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow" />
            </main>
        );
    }

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
                    <h1 className="font-bold text-lg">주문 내역</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-[568px] mx-auto p-4 space-y-3">
                {!user ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-black">
                            <LockKeyhole size={28} />
                        </div>
                        <h2 className="text-lg font-bold mb-2">로그인이 필요합니다</h2>
                        <p className="text-gray-500 mb-6">
                            배달 주문과 주문 내역 조회는 로그인 후 이용할 수 있습니다.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-brand-black text-white px-6 py-3 rounded-xl font-bold"
                        >
                            로그인하고 주문 내역 보기
                        </button>
                        <button
                            onClick={() => router.push('/menu')}
                            className="mt-3 w-full border-2 border-gray-200 px-6 py-3 rounded-xl font-bold"
                        >
                            메뉴 먼저 둘러보기
                        </button>
                    </div>
                ) : isLoading ? (
                    <OrdersPageSkeleton />
                ) : isError ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-2">주문 내역을 불러오지 못했습니다</h2>
                        <p className="text-gray-500">잠시 후 다시 시도해 주세요.</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">-</div>
                        <h2 className="text-lg font-bold mb-2">주문 내역이 없습니다</h2>
                        <p className="text-gray-500 mb-6">첫 주문을 시작해보세요.</p>
                        <button
                            onClick={() => router.push('/menu')}
                            className="bg-brand-black text-white px-6 py-3 rounded-xl font-bold"
                        >
                            메뉴 보러가기
                        </button>
                    </div>
                ) : (
                    orders.map((order) => {
                        const status = statusConfig[order.status];
                        const StatusIcon = status.icon;
                        const paymentBadge = order.paymentStatus
                            ? paymentStatusBadge[order.paymentStatus]
                            : null;
                        const isCancelled = order.status === 'CANCELLED';

                        return (
                            <div
                                key={order.id}
                                className={`bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-100 ${isCancelled ? 'opacity-75' : ''}`}
                                onClick={() => router.push(`/order-detail?id=${order.id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString('ko-KR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                        <p className="font-bold text-sm mt-1">
                                            주문번호: {order.orderNumber}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className={`flex items-center gap-1 ${status.color}`}>
                                            <StatusIcon size={18} />
                                            <span className="font-bold text-sm">{status.label}</span>
                                        </div>
                                        {paymentBadge && (
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentBadge.className}`}>
                                                {paymentBadge.label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-3">
                                    {order.items.slice(0, 2).map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-700">
                                                {item.menuName} x {item.quantity}
                                            </span>
                                            <span className="font-medium">
                                                {item.totalPrice.toLocaleString()}원
                                            </span>
                                        </div>
                                    ))}
                                    {order.items.length > 2 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            외 {order.items.length - 2}개
                                        </p>
                                    )}
                                </div>

                                <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
                                    <span className="font-bold">총 결제 금액</span>
                                    <span className={`font-bold text-lg ${isCancelled ? 'text-gray-400 line-through' : 'text-brand-yellow'}`}>
                                        {order.totalAmount.toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}
