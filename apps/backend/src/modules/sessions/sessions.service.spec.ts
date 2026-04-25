import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
    let service: SessionsService;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            store: {
                findUnique: vi.fn(),
            },
            table: {
                findUnique: vi.fn(),
            },
            tableSession: {
                findFirst: vi.fn(),
                count: vi.fn(),
                create: vi.fn(),
            },
            guest: {
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
            },
        };
        service = new SessionsService(prisma);
    });

    it('rejects starting a session for an inactive store', async () => {
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', isActive: false });
        prisma.table.findUnique.mockResolvedValue({ storeId: 'store-1', tableNumber: 1, status: 'AVAILABLE' });

        await expect(service.startSession('store-1', 1)).rejects.toBeInstanceOf(NotFoundException);

        expect(prisma.tableSession.create).not.toHaveBeenCalled();
    });

    it('rejects starting a session for an unknown table', async () => {
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', isActive: true });
        prisma.table.findUnique.mockResolvedValue(null);

        await expect(service.startSession('store-1', 99)).rejects.toBeInstanceOf(NotFoundException);

        expect(prisma.tableSession.create).not.toHaveBeenCalled();
    });

    it('rejects reserved tables', async () => {
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', isActive: true });
        prisma.table.findUnique.mockResolvedValue({ storeId: 'store-1', tableNumber: 1, status: 'RESERVED' });

        await expect(service.startSession('store-1', 1)).rejects.toBeInstanceOf(BadRequestException);

        expect(prisma.tableSession.create).not.toHaveBeenCalled();
    });

    it('creates a session for an active store and known table', async () => {
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', isActive: true });
        prisma.table.findUnique.mockResolvedValue({ storeId: 'store-1', tableNumber: 1, status: 'AVAILABLE' });
        prisma.tableSession.findFirst.mockResolvedValue(null);
        prisma.tableSession.count.mockResolvedValue(0);
        prisma.tableSession.create.mockResolvedValue({ id: 'session-1', tableNumber: 1 });

        const result = await service.startSession('store-1', 1);

        expect(result).toEqual({ id: 'session-1', tableNumber: 1 });
        expect(prisma.table.findUnique).toHaveBeenCalledWith({
            where: {
                storeId_tableNumber: {
                    storeId: 'store-1',
                    tableNumber: 1,
                },
            },
        });
    });
});
