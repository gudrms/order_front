import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
    let service: OrdersService;
    let prisma: any;
    let queueService: any;

    beforeEach(() => {
        prisma = {};
        queueService = {
            publishPosSendOrder: vi.fn(),
            publishDeliveryStatusChanged: vi.fn(),
        };

        service = new OrdersService(prisma, {} as any, {} as any, queueService);
    });

    it('lists failed POS sync orders for admin visibility', async () => {
        prisma.order = {
            findMany: vi.fn().mockResolvedValue([{ id: 'order-1', posSyncStatus: 'FAILED' }]),
            count: vi.fn().mockResolvedValue(1),
        };

        const result = await service.getPosSyncFailures('store-1', 1);

        expect(result).toEqual({
            data: [{ id: 'order-1', posSyncStatus: 'FAILED' }],
            meta: { total: 1, page: 1, lastPage: 1 },
        });
        expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { storeId: 'store-1', posSyncStatus: 'FAILED' },
        }));
    });

    it('retries POS sync by resetting status and publishing a queue job', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                storeId: 'store-1',
                status: 'PAID',
                tossOrderId: null,
                posSyncStatus: 'FAILED',
            }),
            update: vi.fn().mockResolvedValue({ id: 'order-1', posSyncStatus: 'PENDING' }),
        };

        const result = await service.retryPosSync('store-1', 'order-1');

        expect(result).toEqual({ id: 'order-1', posSyncStatus: 'PENDING' });
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: {
                posSyncStatus: 'PENDING',
                posSyncLastError: null,
                posSyncUpdatedAt: expect.any(Date),
            },
        });
        expect(queueService.publishPosSendOrder).toHaveBeenCalledWith({
            orderId: 'order-1',
            storeId: 'store-1',
        });
    });

    it('rejects POS sync retry for unpaid orders', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                storeId: 'store-1',
                status: 'PENDING_PAYMENT',
                tossOrderId: null,
                posSyncStatus: 'FAILED',
            }),
            update: vi.fn(),
        };

        await expect(service.retryPosSync('store-1', 'order-1')).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.order.update).not.toHaveBeenCalled();
        expect(queueService.publishPosSendOrder).not.toHaveBeenCalled();
    });

    it('starts delivery and moves the customer order status to delivering', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                storeId: 'store-1',
                type: 'DELIVERY',
                status: 'READY',
                userId: 'user-1',
                delivery: { id: 'delivery-1', status: 'ASSIGNED', pickedUpAt: null },
            }),
            update: vi.fn().mockResolvedValue({
                id: 'order-1',
                status: 'DELIVERING',
                delivery: { status: 'DELIVERING' },
            }),
        };

        const result = await service.updateDeliveryStatus('store-1', 'order-1', 'DELIVERING');

        expect(result).toMatchObject({ id: 'order-1', status: 'DELIVERING' });
        expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'order-1' },
            data: expect.objectContaining({
                status: 'DELIVERING',
                delivery: {
                    update: expect.objectContaining({
                        status: 'DELIVERING',
                        pickedUpAt: expect.any(Date),
                    }),
                },
            }),
        }));
    });

    it('marks a delivered order as completed with delivery timestamp', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                storeId: 'store-1',
                type: 'DELIVERY',
                status: 'DELIVERING',
                userId: 'user-1',
                delivery: { id: 'delivery-1', status: 'DELIVERING' },
            }),
            update: vi.fn().mockResolvedValue({
                id: 'order-1',
                status: 'COMPLETED',
                delivery: { status: 'DELIVERED' },
            }),
        };

        await service.updateDeliveryStatus('store-1', 'order-1', 'DELIVERED');

        expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'COMPLETED',
                completedAt: expect.any(Date),
                delivery: {
                    update: expect.objectContaining({
                        status: 'DELIVERED',
                        deliveredAt: expect.any(Date),
                    }),
                },
            }),
        }));
    });

    it('rejects delivery status changes for non-delivery orders', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                storeId: 'store-1',
                type: 'TABLE',
                status: 'READY',
                delivery: null,
            }),
            update: vi.fn(),
        };

        await expect(service.updateDeliveryStatus('store-1', 'order-1', 'DELIVERING')).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.order.update).not.toHaveBeenCalled();
    });
});
