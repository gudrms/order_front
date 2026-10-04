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
            publishNotificationSend: vi.fn(),
        };

        service = new OrdersService(prisma, {} as any, {} as any, queueService);
    });

    it('filters all pages by Korean calendar dates and order state', async () => {
        prisma.order = { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(42) };
        const result = await service.getOrders('store-1', undefined, 2, { startDate: '2026-10-04', endDate: '2026-10-04', state: 'cancelled' });
        expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { storeId: 'store-1', status: 'CANCELLED', createdAt: { gte: new Date('2026-10-03T15:00:00Z'), lt: new Date('2026-10-04T15:00:00Z') } },
            skip: 20, take: 20,
        }));
        expect(result.meta).toMatchObject({ total: 42, page: 2, lastPage: 3, counts: { all: 42, active: 42, cancelled: 42, completed: 42 } });
        expect(prisma.order.count).toHaveBeenCalledWith({ where: { storeId: 'store-1', status: 'COMPLETED', createdAt: { gte: new Date('2026-10-03T15:00:00Z'), lt: new Date('2026-10-04T15:00:00Z') } } });
    });

    it('excludes completed and cancelled orders from the active filter', async () => {
        prisma.order = { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) };
        await service.getOrders('store-1', undefined, 1, { state: 'active' });
        expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { storeId: 'store-1', status: { notIn: ['COMPLETED', 'CANCELLED'] } } }));
    });

    it('rejects invalid dates, reversed ranges, states and pages', async () => {
        await expect(service.getOrders('store-1', undefined, 1, { startDate: '2026-02-30' })).rejects.toThrow(BadRequestException);
        await expect(service.getOrders('store-1', undefined, 1, { startDate: '2026-10-05', endDate: '2026-10-04' })).rejects.toThrow(BadRequestException);
        await expect(service.getOrders('store-1', undefined, 1, { state: 'invalid' })).rejects.toThrow(BadRequestException);
        await expect(service.getOrders('store-1', undefined, 0)).rejects.toThrow(BadRequestException);
    });

    it('saves the store-chosen delivery estimate when accepting a delivery order', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1', storeId: 'store-1', userId: 'user-1', status: 'PAID', delivery: { id: 'delivery-1' },
            }),
            update: vi.fn().mockResolvedValue({ id: 'order-1', status: 'COOKING' }),
        };

        // 관리자 '접수'는 결제 완료에서 바로 조리 중으로 보낸다
        await service.updateOrderStatus('store-1', 'order-1', 'COOKING' as any, { estimatedMinutes: 50 });

        expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'COOKING',
                delivery: { update: { estimatedMinutes: 50 } },
            }),
        }));
        // 고객에게 접수 소식과 예상 시간을 푸시한다
        expect(queueService.publishNotificationSend).toHaveBeenCalledWith(expect.objectContaining({
            recipientType: 'CUSTOMER',
            recipientId: 'user-1',
            notificationType: 'ORDER_CONFIRMED',
            channel: 'PUSH',
            body: expect.stringContaining('약 50분'),
        }));
    });

    it('ignores the estimate for orders without delivery and rejects out-of-range estimates', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({ id: 'order-1', storeId: 'store-1', status: 'PAID', delivery: null }),
            update: vi.fn().mockResolvedValue({}),
        };
        await service.updateOrderStatus('store-1', 'order-1', 'CONFIRMED' as any, { estimatedMinutes: 50 });
        expect(prisma.order.update.mock.calls[0][0].data.delivery).toBeUndefined();

        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1', storeId: 'store-1', status: 'PAID', delivery: { id: 'delivery-1' },
        });
        await expect(
            service.updateOrderStatus('store-1', 'order-1', 'CONFIRMED' as any, { estimatedMinutes: 999 }),
        ).rejects.toBeInstanceOf(BadRequestException);
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

    it('rejects delivery cancellation for paid orders so the payment is not left unrefunded', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                storeId: 'store-1',
                type: 'DELIVERY',
                status: 'CONFIRMED',
                paymentStatus: 'PAID',
                delivery: { id: 'delivery-1', status: 'ASSIGNED', pickedUpAt: null },
            }),
            update: vi.fn(),
        };

        await expect(service.updateDeliveryStatus('store-1', 'order-1', 'CANCELLED')).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('rejects pickup that would skip the kitchen steps of the order status flow', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                storeId: 'store-1',
                type: 'DELIVERY',
                // 조리 시작 전(CONFIRMED)이라 DELIVERING으로 바로 갈 수 없다.
                status: 'CONFIRMED',
                paymentStatus: 'PAID',
                delivery: { id: 'delivery-1', status: 'ASSIGNED', pickedUpAt: null },
            }),
            update: vi.fn(),
        };

        await expect(service.updateDeliveryStatus('store-1', 'order-1', 'PICKED_UP')).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.order.update).not.toHaveBeenCalled();
    });
});
