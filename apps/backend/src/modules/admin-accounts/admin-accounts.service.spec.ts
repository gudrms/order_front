import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { AdminAccountsService } from './admin-accounts.service';

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(),
}));

describe('AdminAccountsService', () => {
    let service: AdminAccountsService;
    let prisma: any;
    let tx: any;
    let supabase: any;
    let config: any;

    const admin = { id: 'admin-1', role: 'ADMIN' };
    const owner = { id: 'owner-1', role: 'OWNER' };
    const store = { id: 'store-1', ownerId: null };

    beforeEach(async () => {
        tx = {
            user: {
                upsert: vi.fn((args) => ({ id: args.create.id, ...args.create })),
                delete: vi.fn(),
            },
            store: {
                update: vi.fn(),
                updateMany: vi.fn(),
            },
        };
        prisma = {
            $transaction: vi.fn((callback) => callback(tx)),
            user: {
                findUnique: vi.fn(),
                findMany: vi.fn(),
            },
            store: {
                findUnique: vi.fn(),
            },
        };
        supabase = {
            auth: {
                admin: {
                    createUser: vi.fn(),
                    updateUserById: vi.fn(),
                    deleteUser: vi.fn(),
                },
            },
        };
        config = {
            get: vi.fn((key: string) => {
                if (key === 'SUPABASE_URL') return 'https://supabase.test';
                if (key === 'SUPABASE_SERVICE_KEY') return 'service-role';
                return undefined;
            }),
        };
        vi.mocked(createClient).mockReturnValue(supabase);

        service = new AdminAccountsService(prisma, config);
    });

    it('allows only ADMIN users to create accounts', async () => {
        prisma.user.findUnique.mockResolvedValue(owner);

        await expect(service.create('owner-1', {
            email: 'owner@example.com',
            password: 'password123',
            role: 'OWNER',
            storeId: 'store-1',
        })).rejects.toBeInstanceOf(ForbiddenException);

        expect(supabase.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('creates an OWNER account and links the selected store', async () => {
        prisma.user.findUnique.mockResolvedValue(admin);
        prisma.store.findUnique.mockResolvedValue(store);
        supabase.auth.admin.createUser.mockResolvedValue({
            data: { user: { id: 'new-owner-1' } },
            error: null,
        });

        const result = await service.create('admin-1', {
            email: 'new-owner@example.com',
            password: 'password123',
            name: 'New Owner',
            phoneNumber: '010-1111-2222',
            role: 'OWNER',
            storeId: 'store-1',
        });

        expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
            email: 'new-owner@example.com',
            password: 'password123',
            email_confirm: true,
            user_metadata: {
                name: 'New Owner',
                phone_number: '010-1111-2222',
            },
        });
        expect(tx.user.upsert).toHaveBeenCalledWith(expect.objectContaining({
            create: expect.objectContaining({
                id: 'new-owner-1',
                role: 'OWNER',
            }),
        }));
        expect(tx.store.update).toHaveBeenCalledWith({
            where: { id: 'store-1' },
            data: { ownerId: 'new-owner-1' },
        });
        expect(result.role).toBe('OWNER');
    });

    it('rolls back the Supabase user when DB creation fails', async () => {
        prisma.user.findUnique.mockResolvedValue(admin);
        prisma.store.findUnique.mockResolvedValue(store);
        supabase.auth.admin.createUser.mockResolvedValue({
            data: { user: { id: 'new-owner-1' } },
            error: null,
        });
        prisma.$transaction.mockRejectedValue(new Error('db failed'));

        await expect(service.create('admin-1', {
            email: 'new-owner@example.com',
            password: 'password123',
            role: 'OWNER',
            storeId: 'store-1',
        })).rejects.toThrow('db failed');

        expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('new-owner-1');
    });

    it('resets passwords through Supabase Admin API', async () => {
        prisma.user.findUnique
            .mockResolvedValueOnce(admin)
            .mockResolvedValueOnce({ id: 'owner-1', role: 'OWNER' });
        supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

        const result = await service.resetPassword('admin-1', 'owner-1', 'newpassword123');

        expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith('owner-1', {
            password: 'newpassword123',
        });
        expect(result).toEqual({ id: 'owner-1', updated: true });
    });

    it('rejects deleting the current admin account', async () => {
        prisma.user.findUnique.mockResolvedValue(admin);

        await expect(service.delete('admin-1', 'admin-1')).rejects.toBeInstanceOf(BadRequestException);

        expect(supabase.auth.admin.deleteUser).not.toHaveBeenCalled();
    });
});
