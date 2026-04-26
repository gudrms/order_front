import { useEffect, useState } from 'react';
import { getOrder } from '../api/endpoints/order';
import { supabase } from '../lib/supabase';
import type { OrderStatus } from '../types/order';

interface UseOrderStatusProps {
    orderId: string;
    initialStatus?: OrderStatus;
    onStatusChange?: (status: OrderStatus) => void;
    pollIntervalMs?: number;
    userId?: string | null;
}

export function useOrderStatus({
    orderId,
    initialStatus,
    onStatusChange,
    pollIntervalMs = 5000,
    userId,
}: UseOrderStatusProps) {
    const [status, setStatus] = useState<OrderStatus | null>(initialStatus || null);

    const applyStatus = (nextStatus: OrderStatus) => {
        setStatus((previousStatus) => {
            if (previousStatus !== nextStatus) {
                onStatusChange?.(nextStatus);
            }
            return nextStatus;
        });
    };

    useEffect(() => {
        if (!orderId) return;

        if (initialStatus) {
            setStatus(initialStatus);
        }

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
                    applyStatus(payload.new.status as OrderStatus);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId, initialStatus, onStatusChange]);

    useEffect(() => {
        if (!orderId || pollIntervalMs <= 0 || !userId) return;

        let isCancelled = false;
        const poll = async () => {
            try {
                const order = await getOrder(orderId);
                if (!isCancelled) {
                    applyStatus(order.status);
                }
            } catch {
                // Realtime remains the primary path; polling failures should not break the UI.
            }
        };

        poll();
        const intervalId = window.setInterval(poll, pollIntervalMs);

        return () => {
            isCancelled = true;
            window.clearInterval(intervalId);
        };
    }, [orderId, pollIntervalMs, onStatusChange, userId]);

    return status;
}
