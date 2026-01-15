import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { OrderStatus } from '../types/order';

interface UseOrderStatusProps {
    orderId: string;
    initialStatus?: OrderStatus;
    onStatusChange?: (status: OrderStatus) => void;
}

export function useOrderStatus({ orderId, initialStatus, onStatusChange }: UseOrderStatusProps) {
    const [status, setStatus] = useState<OrderStatus | null>(initialStatus || null);

    useEffect(() => {
        if (!orderId) return;

        // 초기 상태 설정
        if (initialStatus) {
            setStatus(initialStatus);
        }

        // Supabase Realtime 구독
        const channel = supabase
            .channel(`order-status-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'Order',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    const newStatus = payload.new.status as OrderStatus;
                    setStatus(newStatus);
                    if (onStatusChange) {
                        onStatusChange(newStatus);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId, initialStatus, onStatusChange]);

    return status;
}
