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
            method: 'CASH',
            amount: 15000,
            paymentKey: 'CASH_ORDER_1',
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

    it('creates a cash delivery order with store-scoped order numbering', async () => {
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
                status: 'PENDING',
                paymentStatus: 'PENDING',
                totalAmount: 15000,
            }),
        }));
    });

    it('throws not found when the delivery store is missing', async () => {
        tx.store.findUnique.mockResolvedValue(null);

        await expect(service.createDeliveryOrder('missing-store', dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lists delivery orders by store and recipient phone', async () => {
        prisma.order = {
            findMany: vi.fn().mockResolvedValue([{ id: 'order-1' }]),
            count: vi.fn().mockResolvedValue(1),
        };

        const result = await service.getDeliveryOrders({
            storeId: 'store-1',
            phone: '010-0000-0000',
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
                delivery: {
                    is: {
                        recipientPhone: '010-0000-0000',
                    },
                },
            },
        }));
    });

    it('returns a delivery order detail by id', async () => {
        prisma.order = {
            findUnique: vi.fn().mockResolvedValue({ id: 'order-1' }),
        };

        await expect(service.getOrderById('order-1')).resolves.toEqual({ id: 'order-1' });
        expect(prisma.order.findUnique).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'order-1' },
        }));
    });
});
