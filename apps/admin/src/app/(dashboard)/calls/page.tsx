'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle, Clock, PhoneOff } from 'lucide-react';
import { useStaffCalls, completeStaffCall } from '@/hooks/useStaffCalls';
import { useAdminStore } from '@/contexts/AdminStoreContext';

const CALL_TYPE_LABEL: Record<string, string> = {
    water: '물',
    spoon: '수저',
    tissue: '티슈',
    bill: '계산',
    other: '기타',
};

function timeAgo(isoStr: string): string {
    const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    return `${Math.floor(diff / 3600)}시간 전`;
}

export default function StaffCallsPage() {
    const { selectedStoreId, authHeaders } = useAdminStore();
    const queryClient = useQueryClient();
    const { data: calls = [], isLoading, error } = useStaffCalls();

    const handleComplete = async (callId: string) => {
        if (!selectedStoreId || !authHeaders) return;
        try {
            await completeStaffCall(selectedStoreId, callId, authHeaders);
            await queryClient.invalidateQueries({ queryKey: ['staff-calls', selectedStoreId] });
        } catch (err) {
            console.error('호출 완료 처리 실패:', err);
            alert('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    if (!selectedStoreId) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                <PhoneOff className="w-12 h-12" />
                <p>매장을 선택하면 직원 호출 목록을 확인할 수 있습니다.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                호출 목록을 불러오지 못했습니다.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-500" />
                        직원 호출
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        처리 대기 중인 호출 {calls.length}건
                    </p>
                </div>
            </div>

            {calls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                    <p className="text-sm">현재 대기 중인 호출이 없습니다.</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {calls.map((call) => (
                        <div
                            key={call.id}
                            className="bg-white rounded-xl border border-orange-100 shadow-sm p-5 flex flex-col gap-4"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {call.tableNumber}번 테이블
                                    </p>
                                    <p className="text-sm text-orange-600 font-medium mt-0.5">
                                        {call.callType
                                            ? CALL_TYPE_LABEL[call.callType] ?? call.callType
                                            : '호출'}
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo(call.createdAt)}
                                </span>
                            </div>

                            <button
                                onClick={() => handleComplete(call.id)}
                                className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 active:scale-95 transition-all"
                            >
                                처리 완료
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
