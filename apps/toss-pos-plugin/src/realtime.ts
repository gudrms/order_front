import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import { supabase, STORE_ID, POLLING_INTERVAL } from './config';
import { pollOrders } from './order';

// Reconnect backoff: 5s -> 10s -> 20s -> 40s -> 60s (cap)
const RECONNECT_DELAYS_MS = [5_000, 10_000, 20_000, 40_000, 60_000];

let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

interface RealtimeOrderPayload {
    id: string;
    status?: string;
    tossOrderId?: string | null;
}

function removeRealtimeChannel() {
    if (!realtimeChannel) return;

    try {
        supabase.removeChannel(realtimeChannel);
    } catch (error) {
        console.warn('Failed to remove existing realtime channel:', error);
    } finally {
        realtimeChannel = null;
    }
}

function scheduleReconnect() {
    if (reconnectTimer) return;

    const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
    console.warn(`Realtime connection lost, reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1})`);

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        reconnectAttempt += 1;
        removeRealtimeChannel();
        bindRealtimeChannel();
    }, delay);
}

function bindRealtimeChannel() {
    if (realtimeChannel) return;

    realtimeChannel = supabase
        .channel('pos-orders')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'Order',
                filter: `storeId=eq.${STORE_ID}`,
            },
            async () => {
                console.log('New order received via Realtime');
                await pollOrders();
            },
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'Order',
                filter: `storeId=eq.${STORE_ID}`,
            },
            async (payload) => {
                const updated = payload.new as RealtimeOrderPayload;

                if (updated.status === 'PAID' && !updated.tossOrderId) {
                    console.log(`Order ${updated.id} reached PAID, triggering POS registration`);
                    await pollOrders();
                    return;
                }

                if (updated.status === 'CANCELLED' && updated.tossOrderId) {
                    console.log(`Order ${updated.id} cancelled from delivery app, cancelling in Toss POS`);
                    try {
                        await posPluginSdk.order.cancel(updated.tossOrderId);
                        console.log(`Toss POS order ${updated.tossOrderId} cancelled`);
                    } catch (error) {
                        console.error('Failed to cancel Toss POS order:', error);
                    }
                }
            },
        )
        .subscribe((status, err) => {
            console.log('Supabase Realtime Status:', status);

            if (status === 'SUBSCRIBED') {
                reconnectAttempt = 0;
                return;
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                scheduleReconnect();
            }

            if (err) console.error('Realtime error:', err);
        });
}

export function setupRealtime() {
    bindRealtimeChannel();

    if (!pollingTimer) {
        pollingTimer = setInterval(pollOrders, POLLING_INTERVAL);
        console.log(`Polling started with interval ${POLLING_INTERVAL}ms`);
    }
}
