import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PosController } from './pos.controller';

describe('PosController.updateOrderStatus', () => {
    let controller: PosController;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            order: {
                findUnique: vi.fn(),
                update: vi.fn(),
            },
        };
        controller = new PosController(prisma);
    });

    it('throws NotFoundException when the order does not exist', async () => {
        prisma.order.findUnique.mockResolvedValue(null);

        await expect(
            controller.updateOrderStatus('missing', { status: 'CONFIRMED', tossOrderId: 'toss-1' }),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the existing order without update when status and tossOrderId already match (idempotent no-op)', async () => {
        const existing = { id: 'order-1', status: 'CONFIRMED', tossOrderId: 'toss-1' };
        prisma.order.findUnique.mockResolvedValue(existing);

        const result = await controller.updateOrderStatus(
            'order-1',
            { status: 'CONFIRMED', tossOrderId: 'toss-1' },
            'order-order-1-CONFIRMED',
        );

        expect(result).toBe(existing);
        expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when a different tossOrderId is already linked', async () => {
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'CONFIRMED',
            tossOrderId: 'toss-original',
        });

        await expect(
            controller.updateOrderStatus(
                'order-1',
                { status: 'CONFIRMED', tossOrderId: 'toss-duplicate' },
                'order-order-1-CONFIRMED',
            ),
        ).rejects.toBeInstanceOf(ConflictException);

        expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('updates status and tossOrderId for first-time CONFIRMED transition', async () => {
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'PAID',
            tossOrderId: null,
        });
        prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'CONFIRMED', tossOrderId: 'toss-1' });

        const result = await controller.updateOrderStatus(
            'order-1',
            { status: 'CONFIRMED', tossOrderId: 'toss-1' },
            'order-order-1-CONFIRMED',
        );

        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: {
                status: 'CONFIRMED',
                tossOrderId: 'toss-1',
                posSyncStatus: 'SENT',
                posSyncLastError: null,
                posSyncUpdatedAt: expect.any(Date),
            },
        });
        expect(result.status).toBe('CONFIRMED');
    });

    it('preserves existing tossOrderId when transitioning to CANCELLED with same toss id', async () => {
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'CONFIRMED',
            tossOrderId: 'toss-1',
        });
        prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'CANCELLED', tossOrderId: 'toss-1' });

        await controller.updateOrderStatus(
            'order-1',
            { status: 'CANCELLED', tossOrderId: 'toss-1' },
            'order-order-1-CANCELLED',
        );

        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: { status: 'CANCELLED', tossOrderId: 'toss-1' },
        });
    });
});

describe('PosController.getPendingOrders option mapping', () => {
    let controller: PosController;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            order: { findMany: vi.fn() },
            menu: { findMany: vi.fn() },
            menuOption: { findMany: vi.fn() },
        };
        controller = new PosController(prisma);
    });

    it('maps option tossOptionCode by (menuId, groupName, optionName) — same option name across different menus must not collide', async () => {
        // 회귀 방지: 메뉴 A와 메뉴 B 둘 다 "기본" 옵션을 가진 시나리오.
        // 이전 코드는 옵션명만으로 매핑해 마지막 메뉴의 tossOptionCode가 다른 메뉴 주문에 잘못 들어갔음.
        prisma.order.findMany.mockResolvedValue([
            {
                id: 'order-1',
                orderNumber: 'ORD-001',
                totalAmount: 9000,
                note: null,
                payments: [],
                items: [
                    {
                        menuId: 'menu-A',
                        menuName: 'Taco A',
                        menuPrice: 5000,
                        quantity: 1,
                        selectedOptions: [
                            { optionGroupName: '맵기', optionName: '기본', optionPrice: 0 },
                        ],
                    },
                    {
                        menuId: 'menu-B',
                        menuName: 'Burrito B',
                        menuPrice: 4000,
                        quantity: 1,
                        selectedOptions: [
                            { optionGroupName: '사이즈', optionName: '기본', optionPrice: 0 },
                        ],
                    },
                ],
            },
        ]);
        prisma.menu.findMany.mockResolvedValue([
            { id: 'menu-A', tossMenuCode: '101', category: { id: 'cat-A', name: '메인', tossCategoryCode: '1' } },
            { id: 'menu-B', tossMenuCode: '102', category: { id: 'cat-B', name: '메인', tossCategoryCode: '1' } },
        ]);
        // 두 메뉴 다 옵션명이 "기본"이지만 그룹명/메뉴는 다름. tossOptionCode도 달라야 함.
        prisma.menuOption.findMany.mockResolvedValue([
            { name: '기본', tossOptionCode: '201', optionGroup: { name: '맵기', menuId: 'menu-A' } },
            { name: '기본', tossOptionCode: '202', optionGroup: { name: '사이즈', menuId: 'menu-B' } },
        ]);

        const [order] = await controller.getPendingOrders();

        const itemA = order.items.find(i => i.menuName === 'Taco A')!;
        const itemB = order.items.find(i => i.menuName === 'Burrito B')!;

        expect(itemA.options[0].tossOptionCode).toBe('201'); // 메뉴 A의 "기본" → 201
        expect(itemB.options[0].tossOptionCode).toBe('202'); // 메뉴 B의 "기본" → 202 (이전엔 201로 덮어써졌음)
        expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                status: 'PAID',
                tossOrderId: null,
                posSyncStatus: { in: ['PENDING', 'FAILED'] },
            }),
        }));
    });
});

describe('PosController.markOrderSyncFailed', () => {
    let controller: PosController;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            order: {
                findUnique: vi.fn(),
                update: vi.fn(),
            },
        };
        controller = new PosController(prisma);
    });

    it('records POS sync failure and increments attempt count', async () => {
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            tossOrderId: null,
            posSyncStatus: 'PENDING',
        });
        prisma.order.update.mockResolvedValue({
            id: 'order-1',
            posSyncStatus: 'FAILED',
            posSyncAttemptCount: 1,
        });

        const result = await controller.markOrderSyncFailed('order-1', {
            message: 'POS timeout',
        });

        expect(result.posSyncStatus).toBe('FAILED');
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: {
                posSyncStatus: 'FAILED',
                posSyncAttemptCount: { increment: 1 },
                posSyncLastError: 'POS timeout',
                posSyncUpdatedAt: expect.any(Date),
            },
        });
    });

    it('does not mark already-sent POS orders as failed', async () => {
        const sent = {
            id: 'order-1',
            tossOrderId: 'toss-1',
            posSyncStatus: 'SENT',
        };
        prisma.order.findUnique.mockResolvedValue(sent);

        const result = await controller.markOrderSyncFailed('order-1', {
            message: 'late failure',
        });

        expect(result).toBe(sent);
        expect(prisma.order.update).not.toHaveBeenCalled();
    });
});
