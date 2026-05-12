import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
    BackendQueueEvent,
    DeliveryStatusChangedEventPayload,
    NotificationSendEventPayload,
    OrderPaidEventPayload,
    PaymentPaidEventPayload,
    PaymentReconcileEventPayload,
    PaymentRefundedEventPayload,
    PosSendOrderEventPayload,
    QueueEventPayload,
    QueueEventType,
    QueueMessageRecord,
} from './queue-event.types';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);
    private readonly defaultQueueName: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {
        this.defaultQueueName = config.get<string>('BACKEND_QUEUE_NAME', 'backend_events');
    }

    async publish<TPayload extends QueueEventPayload>(
        eventType: QueueEventType,
        payload: TPayload,
        options: {
            idempotencyKey: string;
            queueName?: string;
            delaySeconds?: number;
        },
    ): Promise<void> {
        const queueName = options.queueName || this.defaultQueueName;
        const event: BackendQueueEvent<TPayload> = {
            eventId: randomUUID(),
            eventType,
            idempotencyKey: options.idempotencyKey,
            occurredAt: new Date().toISOString(),
            payload,
        };

        await this.send(queueName, event, options.delaySeconds || 0);
    }

    async publishOrderPaid(payload: OrderPaidEventPayload): Promise<void> {
        await this.publish('order.paid', payload, {
            idempotencyKey: `order.paid:${payload.orderId}`,
        });
    }

    async publishPaymentPaid(payload: PaymentPaidEventPayload): Promise<void> {
        await this.publish('payment.paid', payload, {
            idempotencyKey: `payment.paid:${payload.paymentId}`,
        });
    }

    async publishPosSendOrder(payload: PosSendOrderEventPayload): Promise<void> {
        await this.publish('pos.send_order', payload, {
            idempotencyKey: `pos.send_order:${payload.orderId}`,
        });
    }

    async publishNotificationSend(payload: NotificationSendEventPayload): Promise<void> {
        const dedupeKey = this.buildNotificationDedupeKey(payload);

        await this.publish('notification.send', payload, {
            idempotencyKey: `notification.send:${dedupeKey}`,
        });
    }

    async publishPaymentReconcile(payload: PaymentReconcileEventPayload): Promise<void> {
        const idempotencyTarget = payload.paymentId || payload.providerOrderId;
        if (!idempotencyTarget) {
            throw new Error('payment.reconcile requires paymentId or providerOrderId');
        }

        await this.publish('payment.reconcile', payload, {
            idempotencyKey: `payment.reconcile:${idempotencyTarget}`,
        });
    }

    async publishPaymentRefunded(payload: PaymentRefundedEventPayload): Promise<void> {
        await this.publish('payment.refunded', payload, {
            idempotencyKey: `payment.refunded:${payload.paymentId}:${payload.totalCancelledAmount}`,
        });
    }

    async publishDeliveryStatusChanged(payload: DeliveryStatusChangedEventPayload): Promise<void> {
        await this.publish('delivery.status_changed', payload, {
            idempotencyKey: `delivery.status_changed:${payload.orderId}:${payload.newStatus}`,
        });
    }

    async retry(event: BackendQueueEvent, options: {
        queueName?: string;
        delaySeconds: number;
    }): Promise<void> {
        await this.send(
            options.queueName || this.defaultQueueName,
            event,
            options.delaySeconds,
        );
    }

    async read(
        queueName = this.defaultQueueName,
        visibilityTimeoutSeconds = 60,
        quantity = 10,
    ): Promise<QueueMessageRecord[]> {
        return this.prisma.$queryRawUnsafe(
            'select * from pgmq.read($1::text, $2::integer, $3::integer)',
            queueName,
            visibilityTimeoutSeconds,
            quantity,
        ) as Promise<QueueMessageRecord[]>;
    }

    async archive(queueName = this.defaultQueueName, messageId: number): Promise<void> {
        await this.prisma.$queryRawUnsafe(
            'select * from pgmq.archive($1::text, $2::bigint)',
            queueName,
            messageId,
        );
    }

    private async send(queueName: string, event: BackendQueueEvent, delaySeconds: number): Promise<void> {
        try {
            await this.prisma.$queryRawUnsafe(
                'select * from pgmq.send($1::text, $2::jsonb, $3::integer)',
                queueName,
                JSON.stringify(event),
                delaySeconds,
            );
        } catch (error) {
            const err = error as Error;
            this.logger.warn(
                `Queue publish failed for ${event.eventType} (${event.idempotencyKey}): ${err.message}`,
            );
            await this.recordPublishFailure(queueName, event, err);
        }
    }

    private async recordPublishFailure(queueName: string, event: BackendQueueEvent, error: Error): Promise<void> {
        try {
            await this.prisma.queueEventLog.upsert({
                where: { idempotencyKey: event.idempotencyKey },
                create: {
                    queueName,
                    eventId: event.eventId,
                    eventType: event.eventType,
                    idempotencyKey: event.idempotencyKey,
                    status: 'FAILED',
                    attemptCount: 0,
                    payload: event.payload as any,
                    lastError: `publish failed: ${error.message}`,
                },
                update: {
                    queueName,
                    eventId: event.eventId,
                    eventType: event.eventType,
                    status: 'FAILED',
                    payload: event.payload as any,
                    lastError: `publish failed: ${error.message}`,
                },
            });
        } catch (logError) {
            const err = logError as Error;
            this.logger.error(
                `Failed to record queue publish failure for ${event.idempotencyKey}: ${err.message}`,
            );
        }
    }

    private buildNotificationDedupeKey(payload: NotificationSendEventPayload): string {
        const recipientId = payload.recipientId || payload.storeId || payload.recipientType;
        const subjectId = payload.orderId || payload.storeId || 'global';
        const channel = payload.channel || 'IN_APP';

        return `${recipientId}:${payload.notificationType}:${subjectId}:${channel}`;
    }
}
