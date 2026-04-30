export type QueueEventType =
    | 'order.paid'
    | 'order.cancelled'
    | 'payment.paid'
    | 'payment.refunded'
    | 'delivery.status_changed'
    | 'pos.send_order'
    | 'notification.send'
    | 'payment.expire_pending'
    | 'payment.reconcile';

export interface QueueEventPayload {
    [key: string]: unknown;
}

export interface BackendQueueEvent<TPayload extends QueueEventPayload = QueueEventPayload> {
    eventId: string;
    eventType: QueueEventType;
    idempotencyKey: string;
    occurredAt: string;
    payload: TPayload;
}

export interface OrderPaidEventPayload extends QueueEventPayload {
    orderId: string;
    storeId?: string;
    paymentId: string;
    providerOrderId?: string;
    amount: number;
}

