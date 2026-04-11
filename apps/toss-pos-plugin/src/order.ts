import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import type { PluginOrderDto } from '@tossplace/pos-plugin-sdk';
import { API_URL } from './config';
import type { BackendOrder } from './types';

const processingOrders = new Set<string>();

const UNKNOWN_CATEGORY = { id: 0, title: '미분류' };

export async function processOrder(order: BackendOrder) {
    if (processingOrders.has(order.id)) {
        console.log(`Order ${order.orderNumber} is already being processed. Skipping.`);
        return;
    }
    processingOrders.add(order.id);

    try {
        console.log(`Processing order: ${order.orderNumber}`);

        const pluginOrderDto: PluginOrderDto = {
            discounts: [],
            lineItems: order.items.map(item => ({
                diningOption: 'DELIVERY' as const,
                item: {
                    id: Number(item.catalogId) || 0,
                    title: item.menuName,
                    category: item.category
                        ? { id: Number(item.category.id), title: item.category.name }
                        : UNKNOWN_CATEGORY,
                    type: 'ITEM' as const,
                },
                quantity: { value: item.quantity },
                chargePrice: { value: item.menuPrice * item.quantity },
                optionChoices: item.options?.map(opt => ({
                    id: Number(opt.tossOptionCode) || 0,
                    quantity: 1,
                })) ?? [],
            })),
        };

        const result = await posPluginSdk.order.add(pluginOrderDto);
        console.log('Toss POS Order Created:', result);

        await updateOrderStatus(order.id, {
            status: 'CONFIRMED',
            tossOrderId: result.id,
        });

        console.log(`Order ${order.orderNumber} synced successfully.`);
    } catch (error) {
        console.error(`Failed to process order ${order.orderNumber}:`, error);
    } finally {
        processingOrders.delete(order.id);
    }
}

export async function updateOrderStatus(
    orderId: string,
    body: { status: string; tossOrderId: string },
    maxRetries = 3
) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${API_URL}/pos/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return;
        } catch (error) {
            console.error(`Status update attempt ${attempt}/${maxRetries} failed for ${orderId}:`, error);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    console.error(`Failed to update status for order ${orderId} after ${maxRetries} retries.`);
}

export async function pollOrders() {
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

export function setupOrderCancelListener() {
    posPluginSdk.order.on('cancel', async (order) => {
        console.log('Order cancelled from Toss POS:', order.id);
        try {
            await updateOrderStatus(order.id, {
                status: 'CANCELLED',
                tossOrderId: order.id,
            });
        } catch (error) {
            console.error('Failed to sync cancellation:', error);
        }
    });
}
