'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
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
 * 직원 호출 목록 조회 + Realtime 구독 훅.
 *
 * - GET /stores/:storeId/calls → PENDING/PROCESSING 호출 목록
 * - Supabase Realtime INSERT → 쿼리 무효화 + STAFF_CALL_EVENT 발생
 * - 30초 자동 갱신
 */
export function useStaffCalls() {
    const { selectedStoreId, authHeaders } = useAdminStore();
    const queryClient = useQueryClient();

    const query = useQuery<StaffCall[]>({
        queryKey: ['staff-calls', selectedStoreId],
        queryFn: async () => {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/stores/${selectedStoreId}/calls`,
                { headers: authHeaders }
            );
            return res.data.data ?? res.data;
        },
        enabled: !!selectedStoreId && !!authHeaders,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
    });

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

    return query;
}

/** 호출 완료 처리 */
export async function completeStaffCall(
    storeId: string,
    callId: string,
    authHeaders: Record<string, string>
): Promise<void> {
    await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/stores/${storeId}/calls/${callId}/complete`,
        {},
        { headers: authHeaders }
    );
}
