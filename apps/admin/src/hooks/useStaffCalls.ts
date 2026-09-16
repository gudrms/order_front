'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import { supabase } from '@/lib/supabase';
import { useAdminStore } from '@/contexts/AdminStoreContext';

export interface StaffCall {
    id: string;
    storeId: string;
    tableNumber: number;
    callType: string | null;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
    createdAt: string;
    completedAt: string | null;
}

export const STAFF_CALL_EVENT = 'admin:new-staff-call';

/** 새 호출 수신 시 커스텀 이벤트 발생 */
export function emitStaffCallAlert(call: Partial<StaffCall>) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<Partial<StaffCall>>(STAFF_CALL_EVENT, { detail: call }));
}

/**
 * 직원 호출 목록 조회 훅 (Realtime 구독 없음).
 *
 * - GET /stores/:storeId/calls → PENDING/PROCESSING 호출 목록
 * - 30초 자동 갱신
 *
 * Realtime 구독(새 호출 토스트)은 레이아웃에 한 번만 마운트되는
 * useStaffCallRealtimeSubscription()이 전담한다. 이 훅을 호출하는
 * 페이지가 늘어나도 Supabase 채널 구독이 중복되지 않는다.
 */
export function useStaffCalls() {
    const { selectedStoreId, authHeaders } = useAdminStore();

    return useQuery<StaffCall[]>({
        queryKey: ['staff-calls', selectedStoreId],
        queryFn: async () => {
            const res = await adminApi.get(
                `${process.env.NEXT_PUBLIC_API_URL}/stores/${selectedStoreId}/calls`,
                { headers: authHeaders }
            );
            return res.data;
        },
        enabled: !!selectedStoreId && !!authHeaders,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
    });
}

/**
 * 새 직원 호출 Realtime 구독 (레이아웃에 한 번만 마운트해서 사용).
 * INSERT 수신 시 staff-calls 쿼리를 무효화하고 STAFF_CALL_EVENT를 발생시킨다.
 */
export function useStaffCallRealtimeSubscription() {
    const { selectedStoreId } = useAdminStore();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!selectedStoreId) return;

        const channel = supabase
            .channel(`staff-calls:${selectedStoreId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'StaffCall',        // Prisma 모델명 그대로 (PascalCase)
                    filter: `storeId=eq.${selectedStoreId}`,
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['staff-calls', selectedStoreId] });
                    emitStaffCallAlert(payload.new as Partial<StaffCall>);
                }
            )
            .subscribe();

        return () => { void supabase.removeChannel(channel); };
    }, [selectedStoreId, queryClient]);
}

/** 호출 완료 처리 */
export async function completeStaffCall(
    storeId: string,
    callId: string,
    authHeaders: Record<string, string>
): Promise<void> {
    await adminApi.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/stores/${storeId}/calls/${callId}/complete`,
        {},
        { headers: authHeaders }
    );
}
