import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { assertCanManageStore } from '../../common/auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from './queue.service';
import { NotificationSendEventPayload } from './queue-event.types';

@Injectable()
export class QueueOperationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly queueService: QueueService,
    ) { }

    async getNotificationFailures(userId: string, storeId: string, page: number = 1) {
        await this.assertCanManageStore(userId, storeId);

        const take = 20;
        const skip = (page - 1) * take;
        const where = {
            storeId,
            status: 'FAILED' as const,
        };

        const [notifications, total] = await Promise.all([
            this.prisma.notificationLog.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.notificationLog.count({ where }),
        ]);

        return {
            data: notifications,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / take),
            },
        };
    }

    async retryNotification(userId: string, storeId: string, notificationId: string) {
        await this.assertCanManageStore(userId, storeId);

        const notification = await this.prisma.notificationLog.findUnique({
            where: { id: notificationId },
        });

        if (!notification) {
            throw new NotFoundException(`Notification not found: ${notificationId}`);
        }
        if (notification.storeId !== storeId) {
            throw new BadRequestException('Notification does not belong to this store');
        }
        if (notification.status === 'SENT') {
            return notification;
        }
        if (!notification.payload || typeof notification.payload !== 'object' || Array.isArray(notification.payload)) {
            throw new BadRequestException('Notification payload is not retryable');
        }

        await this.prisma.notificationLog.update({
            where: { id: notificationId },
            data: {
                status: 'PENDING',
                lastError: null,
            },
        });

        await this.queueService.publishNotificationSend(notification.payload as NotificationSendEventPayload);

        return this.prisma.notificationLog.findUnique({
            where: { id: notificationId },
        });
    }

    private async assertCanManageStore(userId: string, storeId: string) {
        const [user, store] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.store.findUnique({ where: { id: storeId } }),
        ]);

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        assertCanManageStore(user, store);
    }
}
