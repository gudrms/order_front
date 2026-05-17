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

    it('syncs an authenticated OAuth user into the app user table', async () => {
        tx.user.findUnique.mockResolvedValue(null);

        const result = await service.syncAuthenticatedUser({
            id: 'oauth-user-1',
            email: 'oauth@example.com',
            name: 'OAuth User',
            phoneNumber: '010-1111-2222',
        });

        expect(result.role).toBe('USER');
        expect(tx.user.create).toHaveBeenCalledWith({
            data: {
                id: 'oauth-user-1',
                email: 'oauth@example.com',
                name: 'OAuth User',
                phoneNumber: '010-1111-2222',
                role: 'USER',
            },
        });
    });

    it('uses a stable local email fallback when the OAuth provider does not return email', async () => {
        tx.user.findUnique.mockResolvedValue(null);

        await service.syncAuthenticatedUser({
            id: 'oauth-user-no-email',
            email: null,
        });

        expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                id: 'oauth-user-no-email',
                email: 'oauth-user-no-email@supabase.local',
            }),
        }));
    });

    it('preserves an existing admin or owner role during auth sync', async () => {
        tx.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

        await service.syncAuthenticatedUser({
            id: 'admin-1',
            email: 'admin@example.com',
            name: 'Admin',
        });

        expect(tx.user.update).toHaveBeenCalledWith({
            where: { id: 'admin-1' },
            data: {
                email: 'admin@example.com',
                name: 'Admin',
                phoneNumber: undefined,
            },
        });
    });
});
