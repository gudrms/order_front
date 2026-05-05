import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import type { PluginOrderDto, PluginPaymentDto } from '@tossplace/pos-plugin-sdk';
import { API_URL, posApiHeaders } from './config';
import type { BackendOrder, BackendPayment } from './types';

const processingOrders = new Set<string>();

function toPositiveIntegerId(value: string | null | undefined): number | null {
    const numeric = Number(value);
    return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null;
}

function findUnmappedItems(order: BackendOrder) {
    return order.items.filter(item =>
        toPositiveIntegerId(item.catalogId) == null ||
        !item.category ||
        toPositiveIntegerId(item.category.id) == null
    );
}

function buildPluginOrderDto(order: BackendOrder): PluginOrderDto {
    return {
        memo: order.note ?? undefined,
        discounts: [],
        lineItems: order.items.map(item => {
            const catalogId = toPositiveIntegerId(item.catalogId)!;
            const categoryId = toPositiveIntegerId(item.category!.id)!;

            return {
                diningOption: 'DELIVERY' as const,
                item: {
                    id: catalogId,
                    title: item.menuName,
                    category: { id: categoryId, title: item.category!.name },
                    type: 'ITEM' as const,
                },
                quantity: { value: item.quantity },
                chargePrice: { value: item.menuPrice * item.quantity },
                optionChoices: item.options
                    ?.map(opt => toPositiveIntegerId(opt.tossOptionCode))
                    .filter((id): id is number => id != null)
                    .map(id => ({ id, quantity: 1 })) ?? [],
            };
        }),
    };
}

async function cancelTossOrder(tossOrderId: string, context: string) {
    try {
        await posPluginSdk.order.cancel(tossOrderId);
    } catch (cancelError) {
        console.error(`Failed to cancel Toss POS order (${context}):`, cancelError);
    }
}

async function registerExternalPayment(tossOrderId: string, payment: BackendPayment) {
    const dto: PluginPaymentDto<'EXTERNAL'> = {
        sourceType: 'EXTERNAL',
        orderId: tossOrderId,
        amountMoney: payment.amountMoney,
        taxMoney: payment.taxMoney,
        supplyMoney: payment.supplyMoney,
        tipMoney: payment.tipMoney,
        taxExemptMoney: payment.taxExemptMoney,
        approvedNo: payment.approvedNo,
        approvedAt: payment.approvedAt,
        paymentKey: payment.paymentKey,
    };
    await posPluginSdk.payment.add({ id: tossOrderId }, dto);
}

async function confirmOrCleanupBackendStatus(order: BackendOrder, tossOrderId: string) {
    const updated = await updateOrderStatus(order.id, {
        status: 'CONFIRMED',
        tossOrderId,
    });

    if (updated === 'CONFLICT') {
        console.warn(`Order ${order.orderNumber} already linked to a different tossOrderId; cancelling duplicate ${tossOrderId}`);
        await cancelTossOrder(tossOrderId, 'duplicate backend status conflict');
        return false;
    }

    if (updated === 'FAILED') {
        console.error(`Order ${order.orderNumber} PATCH failed after retries; cancelling Toss POS order ${tossOrderId} for clean retry`);
        try { posPluginSdk.toast.open(`Order sync failed: ${order.orderNumber}. Retrying later.`); } catch { /* best-effort */ }
        await cancelTossOrder(tossOrderId, 'backend status update failure');
        return false;
    }

    return true;
}

export async function processOrder(order: BackendOrder) {
    if (processingOrders.has(order.id)) {
        console.log(`Order ${order.orderNumber} is already being processed. Skipping.`);
        return;
    }
    processingOrders.add(order.id);

    try {
        console.log(`Processing order: ${order.orderNumber}`);

        const unmapped = findUnmappedItems(order);
        if (unmapped.length > 0) {
            const names = unmapped.map(i => i.menuName).join(', ');
            console.warn(`Order ${order.orderNumber} has unmapped menus, skipping: ${names}`);
            try {
                posPluginSdk.toast.open(`Menu mapping missing: ${names}`);
            } catch { /* toast best-effort */ }
            return;
        }

        if (!order.payment) {
            console.warn(`Order ${order.orderNumber} has no PAID payment record, skipping.`);
            return;
        }

        const result = await posPluginSdk.order.add(buildPluginOrderDto(order));
        console.log('Toss POS Order Created:', result.id);

        try {
            await registerExternalPayment(result.id, order.payment);
        } catch (paymentError) {
            console.error(`Payment registration failed for ${result.id}, cancelling orphan order to avoid duplicate on retry`, paymentError);
            await cancelTossOrder(result.id, 'payment registration failure');
            return;
        }
        console.log(`Toss POS Payment registered: ${order.payment.paymentKey}`);

        const confirmed = await confirmOrCleanupBackendStatus(order, result.id);
        if (!confirmed) return;

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
): Promise<'OK' | 'CONFLICT' | 'FAILED'> {
    const idempotencyKey = `order-${orderId}-${body.status}`;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${API_URL}/pos/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: posApiHeaders({
                    'Content-Type': 'application/json',
                    'Idempotency-Key': idempotencyKey,
                }),
                body: JSON.stringify(body),
            });
            if (response.status === 409) {
                console.warn(`Status update conflict for ${orderId} (Idempotency-Key=${idempotencyKey})`);
                return 'CONFLICT';
            }
            if (response.status >= 400 && response.status < 500) {
                console.error(`Status update rejected for ${orderId}: HTTP ${response.status} ${response.statusText}`);
                return 'FAILED';
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return 'OK';
        } catch (error) {
            console.error(`Status update attempt ${attempt}/${maxRetries} failed for ${orderId}:`, error);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    console.error(`Failed to update status for order ${orderId} after ${maxRetries} retries.`);
    return 'FAILED';
}

export async function reconcilePendingOrders() {
    try {
        const response = await fetch(`${API_URL}/pos/orders/pending`, {
            headers: posApiHeaders(),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText} for ${API_URL}/pos/orders/pending`);
        }

        const orders: BackendOrder[] = await response.json();
        if (!Array.isArray(orders) || orders.length === 0) return;

        console.log(`Found ${orders.length} pending orders.`);
        for (const order of orders) {
            await processOrder(order);
        }
    } catch (error) {
        console.error('Order reconciliation error:', error);
    }
}

export const pollOrders = reconcilePendingOrders;

export function setupOrderCancelListener() {
    posPluginSdk.payment.on('cancel', async (payment) => {
        const tossOrderId = payment.orderId;
        if (!tossOrderId) {
            console.warn('payment.on(cancel) without orderId, skipping', payment);
            return;
        }
        const backendOrderId = await resolveBackendOrderId(tossOrderId);
        if (!backendOrderId) {
            console.warn(`No backend order found for tossOrderId=${tossOrderId}`);
            return;
        }
        console.log(`Payment cancelled in Toss POS for tossOrderId=${tossOrderId}; backend orderId=${backendOrderId}`);
        try {
            await updateOrderStatus(backendOrderId, {
                status: 'CANCELLED',
                tossOrderId,
            });
        } catch (error) {
            console.error('Failed to sync cancellation:', error);
        }
    });
}

async function resolveBackendOrderId(tossOrderId: string): Promise<string | null> {
    try {
        const response = await fetch(`${API_URL}/pos/orders/by-toss-id/${encodeURIComponent(tossOrderId)}`, {
            headers: posApiHeaders(),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data?.id ?? null;
    } catch (error) {
        console.error('Failed to resolve backend orderId:', error);
        return null;
    }
}
