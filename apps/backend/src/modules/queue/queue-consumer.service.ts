import { Injectable, Logger, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TossApiService } from '../integrations/toss/toss-api.service';
import {
    BackendQueueEvent,
    NotificationSendEventPayload,
    PaymentReconcileEventPayload,
    QueueEventPayload,
    QueueMessageRecord,
} from './queue-event.types';
import { QueueService } from './queue.service';

@Injectable()
export class QueueConsumerService {
    private readonly logger = new Logger(QueueConsumerService.name);
    private readonly maxAttempts = Number(process.env.BACKEND_QUEUE_MAX_ATTEMPTS || 5);
    private readonly backoffSeconds = [10, 30, 60, 180, 300];

    constructor(
        private readonly queueService: QueueService,
        private readonly prisma: PrismaService,
        @Optional() private readonly tossApiService?: TossApiService,
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
            await this.handleOrderPaid(event);
            return;
        }

        if (event.eventType === 'pos.send_order') {
            await this.handlePosSendOrder(event);
            return;
        }

        if (event.eventType === 'notification.send') {
            await this.handleNotificationSend(event as BackendQueueEvent<NotificationSendEventPayload>);
            return;
        }

        if (event.eventType === 'payment.reconcile') {
            await this.handlePaymentReconcile(event as BackendQueueEvent<PaymentReconcileEventPayload>);
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

    private async handlePaymentReconcile(event: BackendQueueEvent<PaymentReconcileEventPayload>) {
        if (!this.tossApiService) {
            throw new Error('Toss API service is not configured');
        }
        if (!event.payload.paymentId && !event.payload.providerOrderId) {
            throw new Error('payment.reconcile requires paymentId or providerOrderId');
        }

        const payment = await this.prisma.payment.findFirst({
            where: {
                provider: 'TOSS_PAYMENTS',
                OR: [
                    ...(event.payload.paymentId ? [{ id: event.payload.paymentId }] : []),
                    ...(event.payload.providerOrderId ? [{ providerOrderId: event.payload.providerOrderId }] : []),
                ],
            },
            include: {
                order: true,
            },
        });

        if (!payment) {
            throw new Error('payment.reconcile target payment not found');
        }
        if (!payment.providerOrderId) {
            throw new Error('payment.reconcile requires providerOrderId');
        }
        if (payment.status === 'PAID' && payment.order.paymentStatus === 'PAID') {
            return;
        }

        const tossPayment = await this.tossApiService.fetchPaymentByOrderId(payment.providerOrderId);
        if (tossPayment?.status !== 'DONE') {
            return;
        }

        const approvedAmount = tossPayment?.totalAmount || tossPayment?.balanceAmount || payment.amount;

        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    paymentKey: tossPayment?.paymentKey || payment.paymentKey,
                    method: this.mapTossMethod(tossPayment?.method),
                    approvedAmount,
                    approvedAt: tossPayment?.approvedAt ? new Date(tossPayment.approvedAt) : new Date(),
                    receiptUrl: tossPayment?.receipt?.url,
                    rawPayload: tossPayment,
                },
            }),
            this.prisma.order.update({
                where: { id: payment.orderId },
                data: {
                    status: 'PAID',
                    paymentStatus: 'PAID',
                },
            }),
        ]);

        await this.queueService.publishPaymentPaid({
            orderId: payment.orderId,
            storeId: payment.order.storeId,
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId,
            amount: approvedAmount,
        });

        await this.queueService.publishOrderPaid({
            orderId: payment.orderId,
            storeId: payment.order.storeId,
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId,
            amount: approvedAmount,
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

    private buildNotificationDedupeKey(payload: NotificationSendEventPayload): string {
        const recipientId = payload.recipientId || payload.storeId || payload.recipientType;
        const subjectId = payload.orderId || payload.storeId || 'global';

        return `${recipientId}:${payload.notificationType}:${subjectId}`;
    }

    private getBackoffSeconds(attemptCount: number): number {
        return this.backoffSeconds[Math.min(attemptCount - 1, this.backoffSeconds.length - 1)];
    }

    private mapTossMethod(method?: string) {
        if (!method) {
            return 'TOSS';
        }

        return method === '카드' || method.toLowerCase().includes('card') ? 'CARD' : 'TOSS';
    }
}
