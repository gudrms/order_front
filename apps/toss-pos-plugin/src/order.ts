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

        // payment.add가 실패하면 방금 만든 토스 주문이 결제 누락 상태로 떠돌게 됨.
        // 다음 폴링이 같은 주문을 또 처리해 tossOrderId-2를 새로 만들어 중복 등록되는 걸 막기 위해
        // 실패 즉시 우리가 만든 toss 주문을 취소하고 빠진다 (백엔드 PATCH도 안 보냄 → 다음 폴링에서 깨끗이 재시도).
        try {
            await registerExternalPayment(result.id, order.payment);
        } catch (paymentError) {
            console.error(`Payment registration failed for ${result.id}, cancelling orphan order to avoid duplicate on retry`, paymentError);
            try {
                await posPluginSdk.order.cancel(result.id);
            } catch (cancelError) {
                console.error('Failed to cancel orphan Toss POS order after payment failure:', cancelError);
            }
            return;
        }
        console.log(`Toss POS Payment registered: ${order.payment.paymentKey}`);

        const updated = await updateOrderStatus(order.id, {
            status: 'CONFIRMED',
            tossOrderId: result.id,
        });

        // 백엔드가 이미 다른 tossOrderId로 연결돼 있어 409로 거부 → 우리가 만든 중복 토스 주문은 취소.
        if (updated === 'CONFLICT') {
            console.warn(`Order ${order.orderNumber} already linked to a different tossOrderId — cancelling duplicate ${result.id}`);
            try {
                await posPluginSdk.order.cancel(result.id);
            } catch (cancelError) {
                console.error('Failed to cancel duplicate Toss POS order:', cancelError);
            }
            return;
        }

        // PATCH가 3회 모두 실패: 토스 POS에는 order+payment 등록됐는데 DB tossOrderId 미반영.
        // 이 상태로 두면 다음 폴링에서 같은 주문을 또 처리해 토스에 중복 등록 → 백엔드 409 가드에 막혀 무한 루프.
        // 따라서 우리가 만든 토스 주문을 취소해 다음 폴링이 깨끗하게 재시도하도록 한다.
        // (운영 알림용 토스트도 띄움.)
        if (updated === 'FAILED') {
            console.error(`Order ${order.orderNumber} PATCH failed after retries — cancelling Toss POS order ${result.id} for clean retry`);
            try { posPluginSdk.toast.open(`주문 동기화 실패: ${order.orderNumber} 재시도 예정`); } catch { /* best-effort */ }
            try {
                await posPluginSdk.order.cancel(result.id);
            } catch (cancelError) {
                console.error('Failed to cancel Toss POS order after PATCH failure:', cancelError);
            }
            return;
        }

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

/**
 * 백엔드 주문 상태/tossOrderId 업데이트.
 * Idempotency-Key를 같이 보내 재시도/플러그인 재시작에도 안전하게 처리:
 * - 동일 키 + 동일 결과 → 백엔드가 기존 결과 반환 (no-op)
 * - 동일 키 + 다른 tossOrderId 덮어쓰기 → 백엔드가 409 Conflict
 * 반환값:
 *   - 'OK'        : 성공 (또는 멱등 no-op)
 *   - 'CONFLICT'  : 다른 tossOrderId가 이미 연결됨 → 호출부가 중복 토스 주문 취소
 *   - 'FAILED'    : 재시도 모두 실패
 */
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
                headers: {
                    'Content-Type': 'application/json',
                    'Idempotency-Key': idempotencyKey,
                },
                body: JSON.stringify(body),
            });
            if (response.status === 409) {
                console.warn(`Status update conflict for ${orderId} (Idempotency-Key=${idempotencyKey})`);
                return 'CONFLICT';
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

export async function pollOrders() {
    try {
        const response = await fetch(`${API_URL}/pos/orders/pending`);
        if (!response.ok) {
            // 404를 silent return 처리하면 안 됨: "주문 없음"이 아니라 "라우트 자체가 없음"이라는
            // 배포 실수 신호. 빈 목록은 200 + [] 로 와야 정상.
            // 모든 비-2xx는 명확한 에러로 처리해 운영 가시성 확보.
            throw new Error(`API Error: ${response.status} ${response.statusText} for ${API_URL}/pos/orders/pending`);
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
