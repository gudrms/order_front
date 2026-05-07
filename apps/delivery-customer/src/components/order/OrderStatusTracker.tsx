'use client';

import { CheckCircle2, ChefHat, Clock, MapPin, Package, XCircle } from 'lucide-react';
import { useOrderStatus } from '@order/shared/hooks/useOrderStatus';
import type { DeliveryStatus, OrderStatus } from '@order/shared';

interface OrderStatusTrackerProps {
    orderId: string;
    initialStatus: OrderStatus;
    deliveryStatus?: DeliveryStatus | null;
    userId?: string | null;
}

const steps = [
    { id: 'PENDING', label: '접수 대기', icon: Clock },
    { id: 'COOKING', label: '조리 중', icon: ChefHat },
    { id: 'DELIVERING', label: '배달 중', icon: MapPin },
    { id: 'COMPLETED', label: '배달 완료', icon: Package },
];

function normalizeStatus(status: string | null) {
    if (!status) return 'PENDING';
    if (status === 'PENDING_PAYMENT' || status === 'PAID') return 'PENDING';
    if (status === 'CONFIRMED' || status === 'PREPARING' || status === 'COOKING') return 'COOKING';
    if (status === 'READY' || status === 'DELIVERING') return 'DELIVERING';
    if (status === 'COMPLETED') return 'COMPLETED';
    return status;
}

function getStatusMessage(status: string | null, deliveryStatus?: DeliveryStatus | null) {
    if (deliveryStatus === 'ASSIGNED') return '라이더가 배정되었습니다. 곧 픽업을 시작합니다.';
    if (deliveryStatus === 'PICKED_UP') return '라이더가 음식을 픽업했습니다. 안전하게 이동 중입니다.';
    if (deliveryStatus === 'DELIVERING') return '배달이 시작되었습니다. 조금만 기다려주세요.';
    if (deliveryStatus === 'DELIVERED') return '배달이 완료되었습니다. 맛있게 드세요.';
    if (deliveryStatus === 'FAILED') return '배달 처리에 문제가 생겼습니다. 매장에서 확인 중입니다.';

    switch (status) {
        case 'PENDING_PAYMENT':
            return '결제 승인을 기다리고 있습니다.';
        case 'PAID':
        case 'PENDING':
            return '매장에서 주문을 확인하고 있습니다.';
        case 'CONFIRMED':
        case 'COOKING':
        case 'PREPARING':
            return '맛있게 조리하고 있습니다.';
        case 'READY':
            return '배달 출발을 준비하고 있습니다.';
        case 'DELIVERING':
            return '배달이 시작되었습니다.';
        case 'COMPLETED':
            return '배달이 완료되었습니다. 맛있게 드세요.';
        case 'CANCELLED':
            return '주문이 취소되었습니다.';
        default:
            return '주문 상태를 확인하고 있습니다.';
    }
}

export function OrderStatusTracker({
    orderId,
    initialStatus,
    deliveryStatus,
    userId,
}: OrderStatusTrackerProps) {
    const status = useOrderStatus({ orderId, initialStatus, userId, pollIntervalMs: 5000 });
    const normalizedStatus = normalizeStatus(status);
    const currentStepIndex = Math.max(0, steps.findIndex((step) => step.id === normalizedStatus));
    const isCancelled = status === 'CANCELLED' || deliveryStatus === 'CANCELLED';

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-6">주문 현황</h2>

            {isCancelled ? (
                <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 p-6 text-red-600">
                    <XCircle size={36} />
                    <p className="font-bold">주문이 취소되었습니다</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full" />
                    <div
                        className="absolute top-5 left-0 h-1 bg-brand-yellow rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    />

                    <div className="relative flex justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${isActive
                                            ? 'bg-brand-yellow text-brand-black shadow-md scale-110'
                                            : 'bg-white border-2 border-gray-200 text-gray-400'
                                            } ${isCurrent ? 'ring-4 ring-brand-yellow/20' : ''}`}
                                    >
                                        {isActive ? (
                                            <Icon size={20} strokeWidth={2.5} />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs font-medium transition-colors duration-300 ${isActive ? 'text-brand-black' : 'text-gray-400'
                                            } ${isCurrent ? 'font-bold' : ''}`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-8 text-center bg-gray-50 rounded-lg p-4">
                <p className="text-brand-black font-medium">
                    {getStatusMessage(status, deliveryStatus)}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
                    <CheckCircle2 size={14} />
                    <span>주문 상태는 자동으로 갱신됩니다</span>
                </div>
            </div>
        </div>
    );
}
