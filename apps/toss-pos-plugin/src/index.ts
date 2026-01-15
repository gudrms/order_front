import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import { createClient } from '@supabase/supabase-js';
import { BackendOrder, PluginOrderDto } from './types';

console.log('Toss POS Plugin initialized (Hybrid Mode: Realtime + Polling)');

// TODO: Use env var
const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1'; // Localhost for testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const POLLING_INTERVAL = 30000; // 30 seconds (Fallback)
const STORE_ID = process.env.STORE_ID || 'YOUR_STORE_ID';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Core Logic ---

async function processOrder(order: BackendOrder) {
    try {
        console.log(`Processing order: ${order.orderNumber}`);

        // 1. Map Backend Order to Toss Plugin Order DTO
        const pluginOrderDto: PluginOrderDto = {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            items: order.items.map(item => ({
                name: item.menuName,
                price: item.menuPrice,
                quantity: item.quantity,
                options: item.options?.map(opt => ({
                    name: opt.name,
                    price: opt.price
                }))
            })),
        };

        // 2. Register order to Toss POS
        // @ts-ignore
        const result = await posPluginSdk.order.add(pluginOrderDto);
        console.log('Toss POS Order Created:', result);

        // 3. Notify Backend that order is processed
        await fetch(`${API_URL}/pos/orders/${order.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'CONFIRMED',
                tossOrderId: (result as any)?.id || (result as any)?.orderId || 'UNKNOWN'
            }),
        });

        console.log(`Order ${order.orderNumber} synced successfully.`);

    } catch (error) {
        console.error(`Failed to process order ${order.orderNumber}:`, error);
    }
}

async function fetchAndProcessOrder(orderId: string) {
    try {
        console.log(`Realtime event for ${orderId}. Triggering poll...`);
        await pollOrders();
    } catch (e) {
        console.error('Error processing realtime event:', e);
    }
}

async function pollOrders() {
    try {
        const response = await fetch(`${API_URL}/pos/orders/pending`);
        if (!response.ok) {
            if (response.status === 404) return;
            throw new Error(`API Error: ${response.status}`);
        }

        const orders: BackendOrder[] = await response.json();

        if (!Array.isArray(orders) || orders.length === 0) return;

        console.log(`Found ${orders.length} pending orders.`);

        for (const order of orders) {
            await processOrder(order);
        }

    } catch (error) {
        console.error('Polling error:', error);
    }
}

// --- Initialization ---

// 1. Start Realtime Listener
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
        async (payload) => {
            console.log('New order received via Realtime:', payload.new);
            const newOrder = payload.new as any;
            // Trigger processing
            await fetchAndProcessOrder(newOrder.id);
        }
    )
    .subscribe((status) => {
        console.log('Supabase Realtime Status:', status);
    });

// 2. Start Polling (Fallback)
setInterval(pollOrders, POLLING_INTERVAL);
console.log(`Polling started with interval ${POLLING_INTERVAL}ms`);

// 3. Initial Check
pollOrders();
