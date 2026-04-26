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
            data: { status: 'CONFIRMED', tossOrderId: 'toss-1' },
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
