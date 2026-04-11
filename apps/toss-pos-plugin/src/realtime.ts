import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import { supabase, STORE_ID, POLLING_INTERVAL } from './config';
import { pollOrders } from './order';

export function setupRealtime() {
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
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.warn('Realtime connection lost, retrying in 5s...');
                setTimeout(() => {
                    supabase.channel('pos-orders').subscribe();
                }, 5000);
            }
            if (err) console.error('Realtime error:', err);
        });

    // Polling fallback
    setInterval(pollOrders, POLLING_INTERVAL);
    console.log(`Polling started with interval ${POLLING_INTERVAL}ms`);
}
