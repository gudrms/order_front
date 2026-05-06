import { Injectable, Logger, Optional } from '@nestjs/common';
import { mapTossMethod } from '../../common/utils/toss.utils';
import { MenuManagementMode, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TossApiService } from '../integrations/toss/toss-api.service';
import { NotificationProviderService } from './notification-provider.service';
import {
    BackendQueueEvent,
    DeliveryStatusChangedEventPayload,
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
        @Optional() private readonly notificationProvider?: NotificationProviderService,
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
            return;
        }

        if (event.eventType === 'delivery.status_changed') {
            await this.handleDeliveryStatusChanged(event as BackendQueueEvent<DeliveryStatusChangedEventPayload>);
        }
    }

    private async handleOrderPaid(event: BackendQueueEvent<QueueEventPayload>) {
        const orderId = String(event.payload.orderId || '');
        if (!orderId) {
            throw new Error('order.paid payload requires orderId');
        }

        const storeId = typeof event.payload.storeId === 'string' ? event.payload.storeId : undefined;

        // TOSS_POS 모드 매장만 POS 전송 큐 발행. ADMIN_DIRECT 매장은 POS 기기가 없으므로 skip.
        if (storeId) {
            const store = await this.prisma.store.findUnique({
                where: { id: storeId },
                select: { menuManagementMode: true },
            });
            if (store?.menuManagementMode === MenuManagementMode.TOSS_POS) {
                await this.queueService.publishPosSendOrder({ orderId, storeId });
            } else {
                this.logger.log(
                    `[order.paid] storeId=${storeId} is ADMIN_DIRECT — skipping pos.send_order for orderId=${orderId}`,
                );
                await this.prisma.order.update({
                    where: { id: orderId },
                    data: { posSyncStatus: 'SKIPPED', posSyncUpdatedAt: new Date() },
                });
            }
        } else {
            // storeId 없으면 안전하게 POS 전송 시도
            await this.queueService.publishPosSendOrder({ orderId });
        }

        if (storeId) {
            // 앱 안의 IN_APP 알림
            await this.queueService.publishNotificationSend({
                recipientType: 'STORE',
                recipientId: storeId,
                notificationType: 'ORDER_PAID',
                orderId,
                storeId,
                channel: 'IN_APP',
            });
            // 푸시 알림 (PWA/Native)
            await this.queueService.publishNotificationSend({
                recipientType: 'STORE',
                recipientId: storeId,
                notificationType: 'ORDER_PAID',
                orderId,
                storeId,
                channel: 'PUSH',
                title: '🌮 새로운 주문 접수!',
                body: '새로운 배달 주문이 들어왔습니다. 확인해주세요.',
            });
        }
    }

    private async handlePosSendOrder(event: BackendQueueEvent<QueueEventPayload>) {
        const orderId = String(event.payload.orderId || '');
        if (!orderId) {
            throw new Error('pos.send_order payload requires orderId');
        }

        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                status: 'PAID',
                tossOrderId: null,
                posSyncStatus: { in: ['PENDING', 'FAILED'] },
            },
            include: {
                store: true,
                items: {
                    include: {
                        selectedOptions: true,
                    },
                },
                delivery: true,
                payments: true,
            },
        });

        if (!order) {
            return;
        }

        // ADMIN_DIRECT 모드 매장은 POS 기기가 없으므로 전송하지 않고 SKIPPED 처리
        if (order.store?.menuManagementMode !== MenuManagementMode.TOSS_POS) {
            this.logger.log(
                `[pos.send_order] store ${order.storeId} is ADMIN_DIRECT — skipping POS send for orderId=${orderId}`,
            );
            await this.prisma.order.update({
                where: { id: orderId },
                data: { posSyncStatus: 'SKIPPED', posSyncUpdatedAt: new Date() },
            });
            return;
        }

        // 실제 Toss POS 등록은 플러그인이 /pos/orders/pending polling 후 SDK로 수행한다.
        // 여기서 MockPosService로 SENT 처리하면 플러그인 polling 대상에서 빠져 실단말 전송이 막힌다.
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                posSyncStatus: 'PENDING',
                posSyncLastError: null,
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

        if (existing?.status === 'SENT') {
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
                status: 'PENDING',
                payload: this.toJsonPayload(payload),
                lastError: null,
            },
            update: {
                recipientType: payload.recipientType,
                recipientId: payload.recipientId,
                notificationType: payload.notificationType,
                orderId: payload.orderId,
                storeId: payload.storeId,
                channel: payload.channel || 'IN_APP',
                status: 'PENDING',
                payload: this.toJsonPayload(payload),
                lastError: null,
            },
        });

        if (!this.notificationProvider) {
            throw new Error('Notification provider is not configured');
        }

        try {
            const result = await this.notificationProvider.send(payload);
            await this.prisma.notificationLog.update({
                where: { dedupeKey },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                    lastError: result.messageId
                        ? `${result.provider}:${result.messageId}`
                        : result.provider,
                },
            });
        } catch (error) {
            await this.prisma.notificationLog.update({
                where: { dedupeKey },
                data: {
                    status: 'FAILED',
                    lastError: (error as Error).message,
                },
            });
            throw error;
        }
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
                    method: mapTossMethod(tossPayment?.method),
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
        const channel = payload.channel || 'IN_APP';

        return `${recipientId}:${payload.notificationType}:${subjectId}:${channel}`;
    }

    private getBackoffSeconds(attemptCount: number): number {
        return this.backoffSeconds[Math.min(attemptCount - 1, this.backoffSeconds.length - 1)];
    }

    private async handleDeliveryStatusChanged(event: BackendQueueEvent<DeliveryStatusChangedEventPayload>) {
        const payload = event.payload;
        if (!payload.orderId || !payload.storeId || !payload.newStatus) {
            throw new Error('delivery.status_changed payload requires orderId, storeId, and newStatus');
        }

        // 배달 완료/취소 등 고객에게 알림이 필요한 상태 변경에 대해 알림 발행.
        const notifiableStatuses = ['ASSIGNED', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'];
        if (notifiableStatuses.includes(payload.newStatus)) {
            const notificationType = payload.newStatus === 'DELIVERED'
                ? 'ORDER_CONFIRMED' as const
                : 'DELIVERY_STATUS_CHANGED' as const;

            // 고객 알림 (배달 상태 변경 시)
            if (payload.userId) {
                const messageMap: Record<string, string> = {
                    'ASSIGNED': '라이더가 배정되었습니다.',
                    'PICKED_UP': '메뉴가 픽업되어 배달을 시작합니다.',
                    'DELIVERING': '배달 중입니다.',
                    'DELIVERED': '배달이 완료되었습니다. 맛있게 드세요!',
                    'CANCELLED': '주문이 취소되었습니다.',
                };
                const body = messageMap[payload.newStatus] || '배달 상태가 변경되었습니다.';

                await this.queueService.publishNotificationSend({
                    recipientType: 'CUSTOMER',
                    recipientId: payload.userId,
                    notificationType,
                    orderId: payload.orderId,
                    storeId: payload.storeId,
                    channel: 'IN_APP',
                });
                await this.queueService.publishNotificationSend({
                    recipientType: 'CUSTOMER',
                    recipientId: payload.userId,
                    notificationType,
                    orderId: payload.orderId,
                    storeId: payload.storeId,
                    channel: 'PUSH',
                    title: '🌮 타코몰리 배달 알림',
                    body,
                });
            }

            // 매장 알림 (배달 취소 시)
            if (payload.newStatus === 'CANCELLED') {
                await this.queueService.publishNotificationSend({
                    recipientType: 'STORE',
                    recipientId: payload.storeId,
                    notificationType: 'DELIVERY_STATUS_CHANGED',
                    orderId: payload.orderId,
                    storeId: payload.storeId,
                    channel: 'IN_APP',
                });
                await this.queueService.publishNotificationSend({
                    recipientType: 'STORE',
                    recipientId: payload.storeId,
                    notificationType: 'DELIVERY_STATUS_CHANGED',
                    orderId: payload.orderId,
                    storeId: payload.storeId,
                    channel: 'PUSH',
                    title: '⚠️ 배달 취소 알림',
                    body: '고객님의 주문이 취소되었습니다.',
                });
            }
        }
    }
}
