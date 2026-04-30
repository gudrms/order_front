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

export interface QueueMessageRecord<TPayload extends QueueEventPayload = QueueEventPayload> {
    msg_id: number | bigint;
    read_ct: number;
    enqueued_at: Date;
    vt: Date;
    message: BackendQueueEvent<TPayload> | string;
}

export interface OrderPaidEventPayload extends QueueEventPayload {
    orderId: string;
    storeId?: string;
    paymentId: string;
    providerOrderId?: string;
    amount: number;
}

export interface PosSendOrderEventPayload extends QueueEventPayload {
    orderId: string;
    storeId?: string;
}

export interface PaymentReconcileEventPayload extends QueueEventPayload {
    paymentId?: string;
    providerOrderId?: string;
}

export interface PaymentRefundedEventPayload extends QueueEventPayload {
    paymentId: string;
    orderId: string;
    storeId?: string;
    providerOrderId?: string;
    refundedAmount: number;
    totalCancelledAmount: number;
    isFullRefund: boolean;
}

export type NotificationRecipientType = 'CUSTOMER' | 'STORE' | 'ADMIN';

export type NotificationType =
    | 'ORDER_PAID'
    | 'ORDER_CONFIRMED'
    | 'ORDER_CANCELLED'
    | 'DELIVERY_STATUS_CHANGED'
    | 'POS_SYNC_FAILED';

export interface NotificationSendEventPayload extends QueueEventPayload {
    recipientType: NotificationRecipientType;
    recipientId?: string;
    notificationType: NotificationType;
    orderId?: string;
    storeId?: string;
    channel?: 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS';
    title?: string;
    body?: string;
    data?: QueueEventPayload;
}
