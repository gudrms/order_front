import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    BackendQueueEvent,
    NotificationSendEventPayload,
    QueueEventPayload,
    QueueMessageRecord,
} from './queue-event.types';
import { QueueService } from './queue.service';

@Injectable()
export class QueueConsumerService {
    private readonly logger = new Logger(QueueConsumerService.name);

    constructor(
        private readonly queueService: QueueService,
        private readonly prisma: PrismaService,
    ) { }

    async processOnce(options: {
        queueName?: string;
        visibilityTimeoutSeconds?: number;
        quantity?: number;
    } = {}) {
        const messages = await this.queueService.read(
            options.queueName,
            options.visibilityTimeoutSeconds,
            options.quantity,
        );

        let processedCount = 0;

        for (const record of messages) {
            const queueName = options.queueName || 'backend_events';

            try {
                const event = this.parseEvent(record);
                const log = await this.startProcessing(queueName, record, event);

                if (log.status === 'SUCCEEDED') {
                    await this.queueService.archive(options.queueName, Number(record.msg_id));
                    continue;
                }

                await this.dispatch(event);

                await this.queueService.archive(options.queueName, Number(record.msg_id));
                await this.markSucceeded(event.idempotencyKey);
                processedCount += 1;
            } catch (error) {
                await this.markFailed(queueName, record, error);
                this.logger.error(`Queue event processing failed: ${error.message}`);
            }
        }

        return {
            processedCount,
        };
    }

    private parseEvent(record: QueueMessageRecord): BackendQueueEvent<QueueEventPayload> {
        if (typeof record.message === 'string') {
            return JSON.parse(record.message) as BackendQueueEvent<QueueEventPayload>;
        }

        return record.message;
    }

    private async dispatch(event: BackendQueueEvent<QueueEventPayload>) {
        this.logger.log(`Queue event received: ${event.eventType} (${event.idempotencyKey})`);

        if (event.eventType === 'order.paid') {
            await this.handleOrderPaid(event);
            return;
        }

        if (event.eventType === 'pos.send_order') {
            await this.handlePosSendOrder(event);
            return;
        }

        if (event.eventType === 'notification.send') {
            await this.handleNotificationSend(event as BackendQueueEvent<NotificationSendEventPayload>);
        }
    }

    private async handleOrderPaid(event: BackendQueueEvent<QueueEventPayload>) {
        const orderId = String(event.payload.orderId || '');
        if (!orderId) {
            throw new Error('order.paid payload requires orderId');
        }

        await this.queueService.publishPosSendOrder({
            orderId,
            storeId: typeof event.payload.storeId === 'string' ? event.payload.storeId : undefined,
        });

        if (typeof event.payload.storeId === 'string') {
            await this.queueService.publishNotificationSend({
                recipientType: 'STORE',
                recipientId: event.payload.storeId,
                notificationType: 'ORDER_PAID',
                orderId,
                storeId: event.payload.storeId,
                channel: 'IN_APP',
            });
        }
    }

    private async handlePosSendOrder(event: BackendQueueEvent<QueueEventPayload>) {
        const orderId = String(event.payload.orderId || '');
        if (!orderId) {
            throw new Error('pos.send_order payload requires orderId');
        }

        await this.prisma.order.updateMany({
            where: {
                id: orderId,
                status: 'PAID',
                tossOrderId: null,
                posSyncStatus: { in: ['PENDING', 'FAILED'] },
            },
            data: {
                posSyncStatus: 'PENDING',
                posSyncUpdatedAt: new Date(),
            },
        });
    }

    private async handleNotificationSend(event: BackendQueueEvent<NotificationSendEventPayload>) {
        const payload = event.payload;
        const dedupeKey = this.buildNotificationDedupeKey(payload);

        if (!payload.recipientType || !payload.notificationType) {
            throw new Error('notification.send payload requires recipientType and notificationType');
        }

        const existing = await this.prisma.notificationLog.findUnique({
            where: { dedupeKey },
        });

        if (existing?.status === 'SENT' || existing?.status === 'SKIPPED') {
            return;
        }

        await this.prisma.notificationLog.upsert({
            where: { dedupeKey },
            create: {
                recipientType: payload.recipientType,
                recipientId: payload.recipientId,
                notificationType: payload.notificationType,
                orderId: payload.orderId,
                storeId: payload.storeId,
                channel: payload.channel || 'IN_APP',
                dedupeKey,
                status: 'SKIPPED',
                payload: this.toJsonPayload(payload),
                lastError: 'Notification provider is not configured yet',
            },
            update: {
                recipientType: payload.recipientType,
                recipientId: payload.recipientId,
                notificationType: payload.notificationType,
                orderId: payload.orderId,
                storeId: payload.storeId,
                channel: payload.channel || 'IN_APP',
                status: 'SKIPPED',
                payload: this.toJsonPayload(payload),
                lastError: 'Notification provider is not configured yet',
            },
        });
    }

    private async startProcessing(
        queueName: string,
        record: QueueMessageRecord,
        event: BackendQueueEvent<QueueEventPayload>,
    ) {
        const existing = await this.prisma.queueEventLog.findUnique({
            where: { idempotencyKey: event.idempotencyKey },
        });

        if (existing?.status === 'SUCCEEDED') {
            return existing;
        }

        return this.prisma.queueEventLog.upsert({
            where: { idempotencyKey: event.idempotencyKey },
            create: {
                queueName,
                messageId: BigInt(record.msg_id),
                eventId: event.eventId,
                eventType: event.eventType,
                idempotencyKey: event.idempotencyKey,
                status: 'PROCESSING',
                attemptCount: 1,
                payload: this.toJsonPayload(event.payload),
            },
            update: {
                queueName,
                messageId: BigInt(record.msg_id),
                eventId: event.eventId,
                eventType: event.eventType,
                status: 'PROCESSING',
                attemptCount: { increment: 1 },
                payload: this.toJsonPayload(event.payload),
                lastError: null,
            },
        });
    }

    private async markSucceeded(idempotencyKey: string) {
        await this.prisma.queueEventLog.update({
            where: { idempotencyKey },
            data: {
                status: 'SUCCEEDED',
                processedAt: new Date(),
            },
        });
    }

    private async markFailed(queueName: string, record: QueueMessageRecord, error: Error) {
        const fallbackKey = `invalid-message:${queueName}:${record.msg_id}`;

        await this.prisma.queueEventLog.upsert({
            where: { idempotencyKey: fallbackKey },
            create: {
                queueName,
                messageId: BigInt(record.msg_id),
                eventType: 'invalid',
                idempotencyKey: fallbackKey,
                status: 'FAILED',
                attemptCount: 1,
                payload: this.toJsonPayload(record.message),
                lastError: error.message,
            },
            update: {
                status: 'FAILED',
                attemptCount: { increment: 1 },
                payload: this.toJsonPayload(record.message),
                lastError: error.message,
            },
        });
    }

    private toJsonPayload(message: unknown): Prisma.InputJsonValue {
        if (typeof message === 'string') {
            try {
                return JSON.parse(message) as Prisma.InputJsonValue;
            } catch {
                return { raw: message };
            }
        }

        return message as Prisma.InputJsonValue;
    }

    private buildNotificationDedupeKey(payload: NotificationSendEventPayload): string {
        const recipientId = payload.recipientId || payload.storeId || payload.recipientType;
        const subjectId = payload.orderId || payload.storeId || 'global';

        return `${recipientId}:${payload.notificationType}:${subjectId}`;
    }
}
