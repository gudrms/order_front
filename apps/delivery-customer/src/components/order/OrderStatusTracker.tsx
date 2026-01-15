'use client';

import { CheckCircle2, ChefHat, Clock, MapPin, Package } from 'lucide-react';
import { useOrderStatus } from '@order/shared';
import type { OrderStatus } from '@order/shared';

interface OrderStatusTrackerProps {
    orderId: string;
    initialStatus: OrderStatus;
}

export function OrderStatusTracker({ orderId, initialStatus }: OrderStatusTrackerProps) {
    const status = useOrderStatus({ orderId, initialStatus });

    const steps = [
        { id: 'PENDING', label: '접수 대기', icon: Clock },
        { id: 'COOKING', label: '조리 중', icon: ChefHat },
        { id: 'DELIVERING', label: '배달 중', icon: MapPin },
        { id: 'COMPLETED', label: '배달 완료', icon: Package },
    ];

    // 현재 상태의 인덱스 찾기
    const getCurrentStepIndex = (currentStatus: string | null) => {
        if (!currentStatus) return 0;

        // 상태 매핑 (예: CONFIRMED -> COOKING으로 취급)
        let mappedStatus = currentStatus;
        if (currentStatus === 'CONFIRMED' || currentStatus === 'PREPARING') mappedStatus = 'COOKING';
        if (currentStatus === 'PAID') mappedStatus = 'PENDING';

        const index = steps.findIndex(step => step.id === mappedStatus);
        return index === -1 ? 0 : index;
    };

    const currentStepIndex = getCurrentStepIndex(status);

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-6">주문 현황</h2>

            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full" />

                {/* Active Progress Bar */}
                <div
                    className="absolute top-5 left-0 h-1 bg-brand-yellow rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />

                {/* Steps */}
                <div className="relative flex justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2">
                                <div
                                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300
                    ${isActive ? 'bg-brand-yellow text-brand-black shadow-md scale-110' : 'bg-white border-2 border-gray-200 text-gray-400'}
                    ${isCurrent ? 'ring-4 ring-brand-yellow/20' : ''}
                  `}
                                >
                                    {isActive ? (
                                        <Icon size={20} strokeWidth={2.5} />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                    )}
                                </div>
                                <span
                                    className={`
                    text-xs font-medium transition-colors duration-300
                    ${isActive ? 'text-brand-black' : 'text-gray-400'}
                    ${isCurrent ? 'font-bold' : ''}
                  `}
                                >
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status Message */}
            <div className="mt-8 text-center bg-gray-50 rounded-lg p-4">
                <p className="text-brand-black font-medium">
                    {status === 'PENDING' && '가게에서 주문을 확인하고 있습니다.'}
                    {(status === 'COOKING' || status === 'CONFIRMED' || status === 'PREPARING') && '맛있게 조리하고 있습니다!'}
                    {status === 'DELIVERING' && '라이더님이 배달을 시작했습니다!'}
                    {status === 'COMPLETED' && '배달이 완료되었습니다. 맛있게 드세요!'}
                    {status === 'CANCELLED' && '주문이 취소되었습니다.'}
                </p>
            </div>
        </div>
    );
}
