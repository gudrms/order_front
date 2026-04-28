import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
    let service: OrdersService;
    let prisma: any;
    let tx: any;

    const store = {
        id: 'store-1',
        isActive: true,
        isDeliveryEnabled: true,
        minimumOrderAmount: 10000,
        deliveryFee: 3000,
        freeDeliveryThreshold: 30000,
        estimatedDeliveryMinutes: 35,
    };

    const menu = {
        id: 'menu-1',
        name: 'Taco',
        price: 12000,
        isActive: true,
        soldOut: false,
        optionGroups: [],
    };

    const dto: any = {
        userId: 'user-1',
        totalAmount: 15000,
        items: [{ menuId: 'menu-1', quantity: 1 }],
        delivery: {
            recipientName: 'Customer',
            recipientPhone: '010-0000-0000',
            address: 'Seoul',
            detailAddress: '101',
            zipCode: '00000',
            deliveryMemo: 'Leave at door',
        },
        payment: {
            method: 'TOSS',
            amount: 15000,
            paymentKey: 'tgen_ORDER_1',
            orderId: 'ORDER_1',
        },
    };

    beforeEach(() => {
        tx = {
            store: {
                findUnique: vi.fn(),
            },
            menu: {
                findMany: vi.fn(),
            },
            order: {
                count: vi.fn(),
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
            },
            payment: {
                updateMany: vi.fn(),
            },
        };
        prisma = {
            $transaction: vi.fn((callback) => callback(tx)),
        };

        service = new OrdersService(prisma, {} as any, {} as any);
    });

    it('rejects delivery orders for an inactive store', async () => {
        tx.store.findUnique.mockResolvedValue({ ...store, isActive: false });

        await expect(service.createDeliveryOrder('store-1', dto)).rejects.toBeInstanceOf(BadRequestException);

        expect(tx.menu.findMany).not.toHaveBeenCalled();
        expect(tx.order.create).not.toHaveBeenCalled();
    });

    it('rejects delivery orders when delivery is disabled', async () => {
        tx.store.findUnique.mockResolvedValue({ ...store, isDeliveryEnabled: false });

        await expect(service.createDeliveryOrder('store-1', dto)).rejects.toBeInstanceOf(BadRequestException);

        expect(tx.menu.findMany).not.toHaveBeenCalled();
        expect(tx.order.create).not.toHaveBeenCalled();
    });

    it('rejects delivery orders below the store minimum amount', async () => {
        tx.store.findUnique.mockResolvedValue({ ...store, minimumOrderAmount: 20000 });
        tx.menu.findMany.mockResolvedValue([menu]);

        await expect(service.createDeliveryOrder('store-1', dto)).rejects.toBeInstanceOf(BadRequestException);

        expect(tx.order.create).not.toHaveBeenCalled();
    });

    it('rejects cash delivery orders', async () => {
        tx.store.findUnique.mockResolvedValue(store);

        await expect(service.createDeliveryOrder('store-1', {
            ...dto,
            payment: {
                ...dto.payment,
                method: 'CASH',
                paymentKey: 'CASH_ORDER_1',
            },
        })).rejects.toBeInstanceOf(BadRequestException);

        expect(tx.menu.findMany).not.toHaveBeenCalled();
        expect(tx.order.create).not.toHaveBeenCalled();
    });

    it('rejects delivery orders without an authenticated user', async () => {
        tx.store.findUnique.mockResolvedValue(store);

        await expect(service.createDeliveryOrder('store-1', {
            ...dto,
            userId: undefined,
        })).rejects.toBeInstanceOf(BadRequestException);

        expect(tx.menu.findMany).not.toHaveBeenCalled();
        expect(tx.order.create).not.toHaveBeenCalled();
    });

    it('creates a delivery order with PENDING_PAYMENT status awaiting Toss approval', async () => {
        tx.store.findUnique.mockResolvedValue(store);
        tx.menu.findMany.mockResolvedValue([menu]);
        tx.order.count.mockResolvedValue(8);
        tx.order.create.mockResolvedValue({ id: 'order-1', orderNumber: '0009' });

        const result = await service.createDeliveryOrder('store-1', dto);

        expect(result).toEqual({ id: 'order-1', orderNumber: '0009' });
        expect(tx.order.count).toHaveBeenCalledWith({ where: { storeId: 'store-1' } });
        expect(tx.order.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                orderNumber: '0009',
                status: 'PENDING_PAYMENT',
                paymentStatus: 'READY',
                totalAmount: 15000,
            }),
        }));
    });

    it('throws not found when the delivery store is missing', async () => {
        tx.store.findUnique.mockResolvedValue(null);

        await expect(service.createDeliveryOrder('missing-store', dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lists delivery orders by authenticated user', async () => {
        prisma.order = {
            findMany: vi.fn().mockResolvedValue([{ id: 'order-1' }]),
            count: vi.fn().mockResolvedValue(1),
        };

        const result = await service.getDeliveryOrders({
            storeId: 'store-1',
            userId: 'user-1',
            page: 1,
        });

        expect(result).toEqual({
            data: [{ id: 'order-1' }],
            meta: {
                total: 1,
                page: 1,
                lastPage: 1,
            },
        });
        expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                type: 'DELIVERY',
                storeId: 'store-1',
                userId: 'user-1',
            },
        }));
    });

    it('requires a user id to list delivery orders', async () => {
        await expect(service.getDeliveryOrders({ storeId: 'store-1' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns a delivery order detail when the authenticated user matches', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                userId: 'user-1',
            }),
        };

        await expect(service.getOrderById('order-1', { userId: 'user-1' })).resolves.toEqual({
            id: 'order-1',
            userId: 'user-1',
        });
        expect(prisma.order.findUnique).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'order-1' },
        }));
    });

    it('hides delivery order detail when lookup ownership does not match', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                userId: 'user-1',
            }),
        };

        await expect(service.getOrderById('order-1', { userId: 'user-2' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cancels a pending payment delivery order owned by the authenticated user', async () => {
        const pendingOrder = {
            id: 'order-1',
            type: 'DELIVERY',
            userId: 'user-1',
            status: 'PENDING_PAYMENT',
            paymentStatus: 'READY',
            delivery: { id: 'delivery-1' },
            payments: [{ id: 'payment-1', status: 'READY' }],
        };
        tx.order.findUnique.mockResolvedValue(pendingOrder);
        tx.payment.updateMany.mockResolvedValue({ count: 1 });
        tx.order.update.mockResolvedValue({
            ...pendingOrder,
            status: 'CANCELLED',
            paymentStatus: 'CANCELLED',
            cancelReason: 'wrong order',
        });

        const result = await service.cancelDeliveryOrder('order-1', {
            userId: 'user-1',
            reason: 'wrong order',
        });

        expect(result).toMatchObject({
            id: 'order-1',
            status: 'CANCELLED',
            paymentStatus: 'CANCELLED',
            cancelReason: 'wrong order',
        });
        expect(tx.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                orderId: 'order-1',
                status: { in: ['READY', 'PENDING'] },
            },
            data: expect.objectContaining({
                status: 'CANCELLED',
            }),
        }));
        expect(tx.order.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'order-1' },
            data: expect.objectContaining({
                status: 'CANCELLED',
                paymentStatus: 'CANCELLED',
                cancelReason: 'wrong order',
            }),
        }));
    });

    it('keeps delivery cancellation idempotent when the order is already cancelled', async () => {
        const cancelledOrder = {
            id: 'order-1',
            type: 'DELIVERY',
            userId: 'user-1',
            status: 'CANCELLED',
            paymentStatus: 'CANCELLED',
            delivery: { id: 'delivery-1' },
            payments: [],
        };
        tx.order.findUnique.mockResolvedValue(cancelledOrder);

        await expect(service.cancelDeliveryOrder('order-1', {
            userId: 'user-1',
        })).resolves.toEqual(cancelledOrder);

        expect(tx.payment.updateMany).not.toHaveBeenCalled();
        expect(tx.order.update).not.toHaveBeenCalled();
    });

    it('rejects customer cancellation for paid delivery orders until refund approval is implemented', async () => {
        tx.order.findUnique.mockResolvedValue({
            id: 'order-1',
            type: 'DELIVERY',
            userId: 'user-1',
            status: 'PAID',
            paymentStatus: 'PAID',
            delivery: { id: 'delivery-1' },
            payments: [{ id: 'payment-1', status: 'PAID' }],
        });

        await expect(service.cancelDeliveryOrder('order-1', {
            userId: 'user-1',
        })).rejects.toBeInstanceOf(BadRequestException);

        expect(tx.payment.updateMany).not.toHaveBeenCalled();
        expect(tx.order.update).not.toHaveBeenCalled();
    });

    it('updates a picked-up delivery order and moves the customer order status to delivering', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({
                id: 'order-1',
                storeId: 'store-1',
                type: 'DELIVERY',
                status: 'READY',
                delivery: { id: 'delivery-1' },
            }),
            update: vi.fn().mockResolvedValue({
                id: 'order-1',
                status: 'DELIVERING',
                delivery: { status: 'PICKED_UP' },
            }),
        };

        const result = await service.updateDeliveryStatus('store-1', 'order-1', 'PICKED_UP');

        expect(result).toMatchObject({
            id: 'order-1',
            status: 'DELIVERING',
            delivery: { status: 'PICKED_UP' },
        });
        expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'order-1' },
            data: expect.objectContaining({
                status: 'DELIVERING',
                delivery: {
                    update: expect.objectContaining({
                        status: 'PICKED_UP',
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
                delivery: { id: 'delivery-1' },
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
