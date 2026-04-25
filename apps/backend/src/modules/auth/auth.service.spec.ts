import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: any;
    let tx: any;

    beforeEach(async () => {
        tx = {
            store: {
                findUnique: vi.fn(),
                update: vi.fn(),
            },
            user: {
                findUnique: vi.fn(),
                create: vi.fn((args) => ({ id: args.data.id, ...args.data })),
                update: vi.fn((args) => ({ id: args.where.id, ...args.data })),
            },
        };
        prisma = {
            $transaction: vi.fn((callback) => callback(tx)),
            user: {
                findUnique: vi.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('registers a regular customer as USER when no invite code is provided', async () => {
        tx.user.findUnique.mockResolvedValue(null);

        const result = await service.register({
            id: 'user-1',
            email: 'customer@example.com',
            name: 'Customer',
        });

        expect(result.role).toBe('USER');
        expect(tx.store.findUnique).not.toHaveBeenCalled();
        expect(tx.user.create).toHaveBeenCalledWith({
            data: {
                id: 'user-1',
                email: 'customer@example.com',
                name: 'Customer',
                phoneNumber: undefined,
                role: 'USER',
            },
        });
    });

    it('rejects an invalid owner invite code', async () => {
        tx.store.findUnique.mockResolvedValue(null);

        await expect(service.register({
            id: 'owner-1',
            email: 'owner@example.com',
            inviteCode: 'BAD-CODE',
        })).rejects.toBeInstanceOf(BadRequestException);

        expect(tx.user.create).not.toHaveBeenCalled();
        expect(tx.store.update).not.toHaveBeenCalled();
    });

    it('registers an invited owner and consumes the store invite code', async () => {
        tx.store.findUnique.mockResolvedValue({ id: 'store-1', inviteCode: 'INVITE-1' });
        tx.user.findUnique.mockResolvedValue(null);

        const result = await service.register({
            id: 'owner-1',
            email: 'owner@example.com',
            inviteCode: 'INVITE-1',
        });

        expect(result.role).toBe('OWNER');
        expect(tx.store.update).toHaveBeenCalledWith({
            where: { id: 'store-1' },
            data: {
                ownerId: 'owner-1',
                inviteCode: null,
            },
        });
    });
});
