import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TableStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { CallsService } from './calls.service';

describe('CallsService', () => {
    let service: CallsService;
    let prisma: any;

    beforeEach(() => {
        prisma = {
            store: {
                findUnique: vi.fn(),
            },
            table: {
                findUnique: vi.fn(),
            },
            staffCall: {
                create: vi.fn(),
            },
        };

        service = new CallsService(prisma as PrismaService);
    });

    it('creates a staff call for an active store table', async () => {
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', isActive: true });
        prisma.table.findUnique.mockResolvedValue({
            storeId: 'store-1',
            tableNumber: 5,
            status: TableStatus.AVAILABLE,
        });
        prisma.staffCall.create.mockResolvedValue({
            id: 'call-1',
            storeId: 'store-1',
            tableNumber: 5,
            callType: 'WATER',
            status: 'PENDING',
        });

        const result = await service.createCall('store-1', 5, { type: 'WATER' });

        expect(result.id).toBe('call-1');
        expect(prisma.table.findUnique).toHaveBeenCalledWith({
            where: {
                storeId_tableNumber: {
                    storeId: 'store-1',
                    tableNumber: 5,
                },
            },
        });
        expect(prisma.staffCall.create).toHaveBeenCalledWith({
            data: {
                storeId: 'store-1',
                tableNumber: 5,
                callType: 'WATER',
            },
        });
    });

    it('rejects inactive stores', async () => {
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', isActive: false });
        prisma.table.findUnique.mockResolvedValue({
            storeId: 'store-1',
            tableNumber: 5,
            status: TableStatus.AVAILABLE,
        });

        await expect(service.createCall('store-1', 5, { type: 'WATER' }))
            .rejects.toBeInstanceOf(NotFoundException);
        expect(prisma.staffCall.create).not.toHaveBeenCalled();
    });

    it('rejects unknown tables', async () => {
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', isActive: true });
        prisma.table.findUnique.mockResolvedValue(null);

        await expect(service.createCall('store-1', 99, { type: 'WATER' }))
            .rejects.toBeInstanceOf(NotFoundException);
        expect(prisma.staffCall.create).not.toHaveBeenCalled();
    });

    it('rejects reserved tables', async () => {
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', isActive: true });
        prisma.table.findUnique.mockResolvedValue({
            storeId: 'store-1',
            tableNumber: 5,
            status: TableStatus.RESERVED,
        });

        await expect(service.createCall('store-1', 5, { type: 'OTHER' }))
            .rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.staffCall.create).not.toHaveBeenCalled();
    });
});
