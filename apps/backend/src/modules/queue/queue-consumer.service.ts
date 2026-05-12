import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    BackendQueueEvent,
    DeliveryStatusChangedEventPayload,
    NotificationSendEventPayload,
    PaymentReconcileEventPayload,
    QueueEventPayload,
    QueueMessageRecord,
} from './queue-event.types';
import { QueueService } from './queue.service';
import { PaymentEventHandler } from './payment-event.handler';
import { PosEventHandler } from './pos-event.handler';
import { NotificationEventHandler } from './notification-event.handler';

@Injectable()
export class QueueConsumerService {
    private readonly logger = new Logger(QueueConsumerService.name);
    private readonly maxAttempts = Number(process.env.BACKEND_QUEUE_MAX_ATTEMPTS || 5);
    private readonly backoffSeconds = [10, 30, 60, 180, 300];

    constructor(
        private readonly queueService: QueueService,
        private readonly prisma: PrismaService,
        private readonly paymentEventHandler: PaymentEventHandler,
        private readonly posEventHandler: PosEventHandler,
        private readonly notificationEventHandler: NotificationEventHandler,
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
            let event: BackendQueueEvent<QueueEventPayload> | undefined;

            try {
                event = this.parseEvent(record);
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
                await this.handleFailure(queueName, options.queueName, record, error, event);
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
            await this.paymentEventHandler.handleOrderPaid(event);
            return;
        }

        if (event.eventType === 'pos.send_order') {
            await this.posEventHandler.handlePosSendOrder(event);
            return;
        }

        if (event.eventType === 'notification.send') {
            await this.notificationEventHandler.handleNotificationSend(
                event as BackendQueueEvent<NotificationSendEventPayload>,
            );
            return;
        }

        if (event.eventType === 'payment.reconcile') {
            await this.paymentEventHandler.handlePaymentReconcile(
                event as BackendQueueEvent<PaymentReconcileEventPayload>,
            );
            return;
        }

        if (event.eventType === 'delivery.status_changed') {
            await this.notificationEventHandler.handleDeliveryStatusChanged(
                event as BackendQueueEvent<DeliveryStatusChangedEventPayload>,
            );
        }
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

    private async handleFailure(
        queueName: string,
        archiveQueueName: string | undefined,
        record: QueueMessageRecord,
        error: Error,
        event?: BackendQueueEvent<QueueEventPayload>,
    ) {
        const failedLog = await this.markFailed(queueName, record, error, event);
        const attemptCount = failedLog?.attemptCount || Number(record.read_ct) || 1;

        if (!event) {
            if (attemptCount >= this.maxAttempts) {
                await this.queueService.archive(archiveQueueName, Number(record.msg_id));
            }
            return;
        }

        if (attemptCount >= this.maxAttempts) {
            await this.queueService.archive(archiveQueueName, Number(record.msg_id));
            return;
        }

        await this.queueService.retry(event, {
            queueName,
            delaySeconds: this.getBackoffSeconds(attemptCount),
        });
        await this.queueService.archive(archiveQueueName, Number(record.msg_id));
    }

    private async markFailed(
        queueName: string,
        record: QueueMessageRecord,
        error: Error,
        event?: BackendQueueEvent<QueueEventPayload>,
    ): Promise<{ attemptCount: number }> {
        if (event) {
            return this.prisma.queueEventLog.update({
                where: { idempotencyKey: event.idempotencyKey },
                data: {
                    status: 'FAILED',
                    lastError: error.message,
                },
                select: { attemptCount: true },
            });
        }

        const fallbackKey = `invalid-message:${queueName}:${record.msg_id}`;

        return this.prisma.queueEventLog.upsert({
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
            select: { attemptCount: true },
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

    private getBackoffSeconds(attemptCount: number): number {
        return this.backoffSeconds[Math.min(attemptCount - 1, this.backoffSeconds.length - 1)];
    }
}
