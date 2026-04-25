'use client';

import { CheckCircle, ChevronLeft, Clock, Loader, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentStore } from '@/contexts/StoreContext';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { useOrders } from '@/hooks/queries/useOrders';
import type { OrderStatus } from '@order/shared';

const statusConfig: Record<OrderStatus, { label: string; icon: any; color: string }> = {
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

export default function OrdersPage() {
    const router = useRouter();
    const { storeId } = useCurrentStore();
    const { deliveryInfo } = useDeliveryStore();
    const phone = deliveryInfo.customerPhone || null;
    const { data, isLoading } = useOrders({ storeId, phone });
    const orders = data?.orders || [];

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
                {!phone ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <h2 className="text-lg font-bold mb-2">연락처가 필요합니다</h2>
                        <p className="text-gray-500 mb-6">비회원 주문 내역은 주문자 연락처 기준으로 조회합니다.</p>
                        <button
                            onClick={() => router.push('/order/checkout')}
                            className="bg-brand-black text-white px-6 py-3 rounded-xl font-bold"
                        >
                            주문 정보 입력하기
                        </button>
                    </div>
                ) : isLoading ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto mb-4" />
                        <p className="text-gray-500">주문 내역을 불러오는 중...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
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

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => router.push(`/order-detail?id=${order.id}`)}
                            >
                                <div className="flex items-center justify-between mb-3">
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
                                    <div className={`flex items-center gap-1 ${status.color}`}>
                                        <StatusIcon size={18} />
                                        <span className="font-bold text-sm">{status.label}</span>
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
                                    <span className="font-bold text-lg text-brand-yellow">
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
