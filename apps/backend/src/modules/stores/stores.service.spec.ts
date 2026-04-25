import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from './stores.service';

describe('StoresService', () => {
    let service: StoresService;
    let prisma: any;

    const admin = { id: 'admin-1', role: 'ADMIN' };
    const owner = { id: 'owner-1', role: 'OWNER' };
    const store = {
        id: 'store-1',
        storeType: 'tacomolly',
        branchId: 'gimpo',
        ownerId: 'owner-1',
    };

    beforeEach(async () => {
        prisma = {
            user: {
                findUnique: vi.fn(),
            },
            store: {
                create: vi.fn((args) => ({ id: 'store-1', ...args.data })),
                findUnique: vi.fn(),
                findMany: vi.fn(),
                update: vi.fn((args) => ({ id: args.where.id, ...args.data })),
            },
            table: {
                findMany: vi.fn(),
                createMany: vi.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StoresService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<StoresService>(StoresService);
    });

    it('allows admins to create stores and generates an invite code', async () => {
        prisma.user.findUnique.mockResolvedValue(admin);

        const result = await service.createStore('admin-1', {
            storeType: 'tacomolly',
            branchId: 'gimpo',
            name: 'Taco Molly Gimpo',
            branchName: 'Gimpo',
            isDeliveryEnabled: true,
        });

        expect(result.inviteCode).toMatch(/^TACOMOLLYGIM-[-A-Z0-9]+$/);
        expect(prisma.store.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                storeType: 'tacomolly',
                branchId: 'gimpo',
                inviteCode: expect.any(String),
                isDeliveryEnabled: true,
            }),
        });
    });

    it('blocks non-admin users from creating stores', async () => {
        prisma.user.findUnique.mockResolvedValue(owner);

        await expect(service.createStore('owner-1', {
            storeType: 'tacomolly',
            branchId: 'gimpo',
            name: 'Taco Molly Gimpo',
            branchName: 'Gimpo',
        })).rejects.toBeInstanceOf(ForbiddenException);

        expect(prisma.store.create).not.toHaveBeenCalled();
    });

    it('allows owners to update their store', async () => {
        prisma.user.findUnique.mockResolvedValue(owner);
        prisma.store.findUnique.mockResolvedValue(store);

        const result = await service.updateStore('owner-1', 'store-1', {
            isDeliveryEnabled: true,
            deliveryFee: 3000,
        });

        expect(result).toEqual(expect.objectContaining({
            id: 'store-1',
            isDeliveryEnabled: true,
            deliveryFee: 3000,
        }));
    });

    it('creates tables after checking duplicate table numbers', async () => {
        prisma.user.findUnique.mockResolvedValue(owner);
        prisma.store.findUnique.mockResolvedValue(store);
        prisma.table.findMany
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                { storeId: 'store-1', tableNumber: 1, capacity: 4 },
                { storeId: 'store-1', tableNumber: 2, capacity: 4 },
            ]);

        const result = await service.createTables('owner-1', 'store-1', {
            startNumber: 1,
            count: 2,
            capacity: 4,
        });

        expect(prisma.table.createMany).toHaveBeenCalledWith({
            data: [
                { storeId: 'store-1', tableNumber: 1, capacity: 4 },
                { storeId: 'store-1', tableNumber: 2, capacity: 4 },
            ],
        });
        expect(result).toHaveLength(2);
    });

    it('rejects duplicate table numbers', async () => {
        prisma.user.findUnique.mockResolvedValue(owner);
        prisma.store.findUnique.mockResolvedValue(store);
        prisma.table.findMany.mockResolvedValue([{ tableNumber: 2 }]);

        await expect(service.createTables('owner-1', 'store-1', {
            startNumber: 1,
            count: 3,
        })).rejects.toBeInstanceOf(BadRequestException);

        expect(prisma.table.createMany).not.toHaveBeenCalled();
    });
});
