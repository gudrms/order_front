import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueOperationsService } from './queue-operations.service';

describe('QueueOperationsService', () => {
    let service: QueueOperationsService;
    let prisma: any;
    let queueService: any;

    beforeEach(() => {
        prisma = {
            user: {
                findUnique: vi.fn().mockResolvedValue({ id: 'owner-1', role: 'OWNER' }),
            },
            store: {
                findUnique: vi.fn().mockResolvedValue({ id: 'store-1', ownerId: 'owner-1' }),
            },
            notificationLog: {
                findMany: vi.fn(),
                count: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
            },
        };
        queueService = {
            publishNotificationSend: vi.fn(),
        };
        service = new QueueOperationsService(prisma, queueService);
    });

    it('lists failed notifications for a manageable store', async () => {
        prisma.notificationLog.findMany.mockResolvedValue([{ id: 'notification-1', status: 'FAILED' }]);
        prisma.notificationLog.count.mockResolvedValue(1);

        const result = await service.getNotificationFailures('owner-1', 'store-1', 1);

        expect(result).toEqual({
            data: [{ id: 'notification-1', status: 'FAILED' }],
            meta: {
                total: 1,
                page: 1,
                lastPage: 1,
            },
        });
        expect(prisma.notificationLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                storeId: 'store-1',
                status: 'FAILED',
            },
        }));
    });

    it('retries a failed notification by resetting status and publishing a queue job', async () => {
        const payload = {
            notificationType: 'ORDER_PAID',
            recipientType: 'STORE',
            storeId: 'store-1',
            orderId: 'order-1',
        };
        prisma.notificationLog.findUnique
            .mockResolvedValueOnce({
                id: 'notification-1',
                storeId: 'store-1',
                status: 'FAILED',
                payload,
            })
            .mockResolvedValueOnce({
                id: 'notification-1',
                storeId: 'store-1',
                status: 'PENDING',
                payload,
            });

        const result = await service.retryNotification('owner-1', 'store-1', 'notification-1');

        expect(result).toMatchObject({ id: 'notification-1', status: 'PENDING' });
        expect(prisma.notificationLog.update).toHaveBeenCalledWith({
            where: { id: 'notification-1' },
            data: {
                status: 'PENDING',
                lastError: null,
            },
        });
        expect(queueService.publishNotificationSend).toHaveBeenCalledWith(payload);
    });

    it('rejects notification retry for another store', async () => {
        prisma.notificationLog.findUnique.mockResolvedValue({
            id: 'notification-1',
            storeId: 'other-store',
            status: 'FAILED',
            payload: { notificationType: 'ORDER_PAID' },
        });

        await expect(service.retryNotification('owner-1', 'store-1', 'notification-1')).rejects.toBeInstanceOf(BadRequestException);
        expect(queueService.publishNotificationSend).not.toHaveBeenCalled();
    });

    it('rejects retry when the notification payload is not an object', async () => {
        prisma.notificationLog.findUnique.mockResolvedValue({
            id: 'notification-1',
            storeId: 'store-1',
            status: 'FAILED',
            payload: null,
        });

        await expect(service.retryNotification('owner-1', 'store-1', 'notification-1')).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.notificationLog.update).not.toHaveBeenCalled();
    });

    it('throws not found when the store is missing', async () => {
        prisma.store.findUnique.mockResolvedValue(null);

        await expect(service.getNotificationFailures('owner-1', 'missing-store', 1)).rejects.toBeInstanceOf(NotFoundException);
    });
});
