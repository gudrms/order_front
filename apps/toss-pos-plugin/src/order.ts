import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import type { PluginOrderDto } from '@tossplace/pos-plugin-sdk';
import { API_URL } from './config';
import type { BackendOrder, BackendPayment } from './types';

const processingOrders = new Set<string>();

export async function processOrder(order: BackendOrder) {
    if (processingOrders.has(order.id)) {
        console.log(`Order ${order.orderNumber} is already being processed. Skipping.`);
        return;
    }
    processingOrders.add(order.id);

    try {
        console.log(`Processing order: ${order.orderNumber}`);

        const unmapped = order.items.filter(item => !item.catalogId || !item.category);
        if (unmapped.length > 0) {
            const names = unmapped.map(i => i.menuName).join(', ');
            console.warn(`Order ${order.orderNumber} has unmapped menus, skipping: ${names}`);
            try {
                posPluginSdk.toast.open(`매장 메뉴 매핑 누락: ${names}`);
            } catch { /* toast best-effort */ }
            return;
        }

        if (!order.payment) {
            console.warn(`Order ${order.orderNumber} has no PAID payment record, skipping.`);
            return;
        }

        const pluginOrderDto: PluginOrderDto = {
            memo: order.note ?? undefined,
            discounts: [],
            lineItems: order.items.map(item => ({
                diningOption: 'DELIVERY' as const,
                item: {
                    id: Number(item.catalogId),
                    title: item.menuName,
                    category: { id: Number(item.category!.id), title: item.category!.name },
                    type: 'ITEM' as const,
                },
                quantity: { value: item.quantity },
                chargePrice: { value: item.menuPrice * item.quantity },
                optionChoices: item.options
                    ?.filter(opt => !!opt.tossOptionCode)
                    .map(opt => ({
                        id: Number(opt.tossOptionCode),
                        quantity: 1,
                    })) ?? [],
            })),
        };

        const result = await posPluginSdk.order.add(pluginOrderDto);
        console.log('Toss POS Order Created:', result.id);

        await registerExternalPayment(result.id, order.payment);
        console.log(`Toss POS Payment registered: ${order.payment.paymentKey}`);

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

async function registerExternalPayment(tossOrderId: string, payment: BackendPayment) {
    // PluginPaymentDto<EXTERNAL>: 배달앱이 토스페이먼츠로 이미 결제 완료 → POS에 EXTERNAL 원장 생성
    await posPluginSdk.payment.add(
        { id: tossOrderId },
        {
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
        } as any,
    );
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
    // SDK 0.0.16+: order.on('cancel')는 deprecated. payment.on('cancel')로 대체.
    // 분할 결제 시 cancel이 결제마다 발생하므로, 완납 취소 여부는 백엔드가 판정.
    posPluginSdk.payment.on('cancel', async (payment) => {
        const tossOrderId = (payment as any).orderId;
        if (!tossOrderId) {
            console.warn('payment.on(cancel) without orderId, skipping', payment);
            return;
        }
        const backendOrderId = await resolveBackendOrderId(tossOrderId);
        if (!backendOrderId) {
            console.warn(`No backend order found for tossOrderId=${tossOrderId}`);
            return;
        }
        console.log(`Payment cancelled in Toss POS for tossOrderId=${tossOrderId} → backend orderId=${backendOrderId}`);
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
        const response = await fetch(`${API_URL}/pos/orders/by-toss-id/${encodeURIComponent(tossOrderId)}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data?.id ?? null;
    } catch (error) {
        console.error('Failed to resolve backend orderId:', error);
        return null;
    }
}
