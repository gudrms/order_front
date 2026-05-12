import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationProviderService } from './notification-provider.service';
import { QueueService } from './queue.service';
import {
    BackendQueueEvent,
    DeliveryStatusChangedEventPayload,
    NotificationSendEventPayload,
} from './queue-event.types';

@Injectable()
export class NotificationEventHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationProvider: NotificationProviderService,
        private readonly queueService: QueueService,
    ) { }

    async handleNotificationSend(event: BackendQueueEvent<NotificationSendEventPayload>) {
        const payload = event.payload;
        const dedupeKey = buildNotificationDedupeKey(payload);

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
                payload: toJsonPayload(payload),
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
                payload: toJsonPayload(payload),
                lastError: null,
            },
        });

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

    async handleDeliveryStatusChanged(event: BackendQueueEvent<DeliveryStatusChangedEventPayload>) {
        const payload = event.payload;
        if (!payload.orderId || !payload.storeId || !payload.newStatus) {
            throw new Error('delivery.status_changed payload requires orderId, storeId, and newStatus');
        }

        const notifiableStatuses = ['ASSIGNED', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'];
        if (!notifiableStatuses.includes(payload.newStatus)) {
            return;
        }

        const notificationType = payload.newStatus === 'DELIVERED'
            ? 'ORDER_CONFIRMED' as const
            : 'DELIVERY_STATUS_CHANGED' as const;

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

export function buildNotificationDedupeKey(payload: NotificationSendEventPayload): string {
    const recipientId = payload.recipientId || payload.storeId || payload.recipientType;
    const subjectId = payload.orderId || payload.storeId || 'global';
    const channel = payload.channel || 'IN_APP';

    return `${recipientId}:${payload.notificationType}:${subjectId}:${channel}`;
}

function toJsonPayload(message: unknown): Prisma.InputJsonValue {
    if (typeof message === 'string') {
        try {
            return JSON.parse(message) as Prisma.InputJsonValue;
        } catch {
            return { raw: message };
        }
    }

    return message as Prisma.InputJsonValue;
}
