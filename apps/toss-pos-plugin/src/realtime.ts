import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import { supabase, STORE_ID, POLLING_INTERVAL } from './config';
import { pollOrders } from './order';

// 재연결 백오프: 5s → 10s → 20s → 40s → 60s (cap)
const RECONNECT_DELAYS_MS = [5_000, 10_000, 20_000, 40_000, 60_000];
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pollingTimer: ReturnType<typeof setInterval> | null = null;

function scheduleReconnect() {
    if (reconnectTimer) return; // 이미 예약됨
    const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
    console.warn(`Realtime connection lost, reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1})`);
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        reconnectAttempt += 1;
        // 기존 채널을 정리한 뒤 listener를 다시 박아야 한다.
        // 단순 channel(name).subscribe()는 빈 채널이라 콜백이 영영 안 옴 → 반드시 setupRealtime() 재호출.
        try { supabase.removeChannel(supabase.channel('pos-orders')); } catch { /* noop */ }
        bindRealtimeChannel();
    }, delay);
}

function bindRealtimeChannel() {
    supabase
        .channel('pos-orders')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'Order',
                filter: `storeId=eq.${STORE_ID}`
            },
            async () => {
                console.log('New order received via Realtime');
                await pollOrders();
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'Order',
                filter: `storeId=eq.${STORE_ID}`
            },
            async (payload) => {
                const updated = payload.new as any;
                // 결제 완료(PENDING_PAYMENT → PAID) → 즉시 POS 등록 트리거
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
            }
        )
        .subscribe((status, err) => {
            console.log('Supabase Realtime Status:', status);
            if (status === 'SUBSCRIBED') {
                reconnectAttempt = 0; // 정상 연결되면 백오프 리셋
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

    // Polling fallback (이미 동작 중이면 중복 시작 안 함)
    if (!pollingTimer) {
        pollingTimer = setInterval(pollOrders, POLLING_INTERVAL);
        console.log(`Polling started with interval ${POLLING_INTERVAL}ms`);
    }
}
