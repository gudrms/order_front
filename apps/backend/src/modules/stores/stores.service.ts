import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto, CreateTablesDto, UpdateStoreDto } from './dto/store-admin.dto';

@Injectable()
export class StoresService {
    constructor(private readonly prisma: PrismaService) { }

    async getStore(storeId: string) {
        return this.prisma.store.findUnique({
            where: { id: storeId },
        });
    }

    async getStoreByPath(storeType: string, branchId: string) {
        return this.prisma.store.findUnique({
            where: {
                storeType_branchId: {
                    storeType,
                    branchId,
                },
            },
        });
    }

    async getMyStores(userId: string) {
        return this.prisma.store.findMany({
            where: { ownerId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createStore(userId: string, dto: CreateStoreDto) {
        await this.assertAdmin(userId);

        return this.prisma.store.create({
            data: {
                ...dto,
                businessHours: dto.businessHours as any,
                theme: dto.theme as any,
                inviteCode: dto.inviteCode || this.generateInviteCode(dto.storeType, dto.branchId),
            },
        });
    }

    async updateStore(userId: string, storeId: string, dto: UpdateStoreDto) {
        await this.assertCanManageStore(userId, storeId);

        return this.prisma.store.update({
            where: { id: storeId },
            data: {
                ...dto,
                businessHours: dto.businessHours as any,
                theme: dto.theme as any,
            },
        });
    }

    async refreshInviteCode(userId: string, storeId: string) {
        const store = await this.assertCanManageStore(userId, storeId);
        const inviteCode = this.generateInviteCode(store.storeType, store.branchId);

        return this.prisma.store.update({
            where: { id: storeId },
            data: { inviteCode },
            select: {
                id: true,
                inviteCode: true,
            },
        });
    }

    async createTables(userId: string, storeId: string, dto: CreateTablesDto) {
        await this.assertCanManageStore(userId, storeId);

        const tableNumbers = Array.from({ length: dto.count }, (_, index) => dto.startNumber + index);
        const existingTables = await this.prisma.table.findMany({
            where: {
                storeId,
                tableNumber: { in: tableNumbers },
            },
            select: { tableNumber: true },
        });

        if (existingTables.length > 0) {
            throw new BadRequestException(`Tables already exist: ${existingTables.map((table) => table.tableNumber).join(', ')}`);
        }

        await this.prisma.table.createMany({
            data: tableNumbers.map((tableNumber) => ({
                storeId,
                tableNumber,
                capacity: dto.capacity || 4,
            })),
        });

        return this.prisma.table.findMany({
            where: {
                storeId,
                tableNumber: { in: tableNumbers },
            },
            orderBy: { tableNumber: 'asc' },
        });
    }

    async getTables(userId: string, storeId: string) {
        await this.assertCanManageStore(userId, storeId);

        return this.prisma.table.findMany({
            where: { storeId },
            orderBy: { tableNumber: 'asc' },
        });
    }

    private async assertAdmin(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.role !== 'ADMIN') {
            throw new ForbiddenException('Only admins can create stores');
        }
    }

    private async assertCanManageStore(userId: string, storeId: string) {
        const [user, store] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.store.findUnique({ where: { id: storeId } }),
        ]);

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        if (!user || (user.role !== 'ADMIN' && store.ownerId !== userId)) {
            throw new ForbiddenException('You do not have permission to manage this store');
        }

        return store;
    }

    private generateInviteCode(storeType: string, branchId: string) {
        const prefix = `${storeType}-${branchId}`
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 12)
            .toUpperCase();

        return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
    }
}
