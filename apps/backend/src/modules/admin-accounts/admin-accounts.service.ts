import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { assertPlatformAdmin } from '../../common/auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminAccountDto } from './dto/admin-account.dto';

@Injectable()
export class AdminAccountsService {
    private client: SupabaseClient | null = null;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {}

    private getClient(): SupabaseClient {
        if (this.client) return this.client;

        const url = this.config.get<string>('SUPABASE_URL');
        const serviceKey = this.config.get<string>('SUPABASE_SERVICE_KEY');

        if (!url || !serviceKey) {
            throw new InternalServerErrorException(
                'Supabase Admin API is not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY missing)',
            );
        }

        this.client = createClient(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        return this.client;
    }

    private async assertAdmin(actorId: string) {
        const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
        assertPlatformAdmin(actor);
        return actor;
    }

    async list(actorId: string) {
        await this.assertAdmin(actorId);

        return this.prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'OWNER'] } },
            orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                email: true,
                name: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                stores: {
                    select: {
                        id: true,
                        name: true,
                        branchName: true,
                    },
                },
            },
        });
    }

    async create(actorId: string, dto: CreateAdminAccountDto) {
        await this.assertAdmin(actorId);

        if (dto.role === 'OWNER' && !dto.storeId) {
            throw new BadRequestException('OWNER account requires a storeId');
        }

        if (dto.storeId) {
            const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
            if (!store) throw new NotFoundException('Store not found');
        }

        const client = this.getClient();
        const { data, error } = await client.auth.admin.createUser({
            email: dto.email,
            password: dto.password,
            email_confirm: true,
            user_metadata: {
                name: dto.name,
                phone_number: dto.phoneNumber,
            },
        });

        if (error || !data.user) {
            throw new BadRequestException(error?.message || 'Supabase user creation failed');
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.upsert({
                    where: { id: data.user.id },
                    update: {
                        email: dto.email,
                        name: dto.name,
                        phoneNumber: dto.phoneNumber,
                        role: dto.role,
                    },
                    create: {
                        id: data.user.id,
                        email: dto.email,
                        name: dto.name,
                        phoneNumber: dto.phoneNumber,
                        role: dto.role,
                    },
                });

                if (dto.role === 'OWNER' && dto.storeId) {
                    await tx.store.update({
                        where: { id: dto.storeId },
                        data: { ownerId: user.id },
                    });
                }

                return user;
            });
        } catch (err) {
            await client.auth.admin.deleteUser(data.user.id);
            throw err;
        }
    }

    async resetPassword(actorId: string, userId: string, password: string) {
        await this.assertAdmin(actorId);

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !['ADMIN', 'OWNER'].includes(user.role)) {
            throw new NotFoundException('Admin account not found');
        }

        const { error } = await this.getClient().auth.admin.updateUserById(userId, { password });
        if (error) throw new BadRequestException(error.message);

        return { id: userId, updated: true };
    }

    async delete(actorId: string, userId: string) {
        await this.assertAdmin(actorId);

        if (actorId === userId) {
            throw new BadRequestException('You cannot delete your own account');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !['ADMIN', 'OWNER'].includes(user.role)) {
            throw new NotFoundException('Admin account not found');
        }

        const { error } = await this.getClient().auth.admin.deleteUser(userId);
        if (error) throw new BadRequestException(error.message);

        await this.prisma.$transaction(async (tx) => {
            await tx.store.updateMany({
                where: { ownerId: userId },
                data: { ownerId: null },
            });
            await tx.user.delete({ where: { id: userId } });
        });

        return { id: userId, deleted: true };
    }
}
