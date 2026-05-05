import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { assertCanCreateStore, assertCanManageStore } from '../../common/auth/permissions';
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

    async getActiveStores() {
        return this.prisma.store.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                name: true,
                branchName: true,
                storeType: true,
                branchId: true,
                address: true,
                phoneNumber: true,
                businessHours: true,
                isActive: true,
                isDeliveryEnabled: true,
                minimumOrderAmount: true,
                deliveryFee: true,
                freeDeliveryThreshold: true,
                estimatedDeliveryMinutes: true,
            },
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

    /**
     * 매장 일일 통계 (오늘 자정 기준)
     * - todayOrderCount : 오늘 접수된 주문 수 (결제 여부 무관)
     * - todaySales      : 오늘 승인 완료된 결제 합계
     * - pendingOrderCount: 현재 처리 중인 주문 수 (PAID ~ DELIVERING)
     * - soldOutMenuCount : 품절 처리된 활성 메뉴 수
     */
    async getStoreStats(userId: string, storeId: string) {
        await this.assertCanManageStore(userId, storeId);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [todayOrderCount, salesAgg, pendingOrderCount, soldOutMenuCount] =
            await Promise.all([
                // 오늘 들어온 주문 (취소 제외)
                this.prisma.order.count({
                    where: {
                        storeId,
                        createdAt: { gte: todayStart },
                        status: { notIn: ['CANCELLED', 'PENDING_PAYMENT'] },
                    },
                }),
                // 오늘 결제 승인 합계
                this.prisma.payment.aggregate({
                    _sum: { approvedAmount: true },
                    where: {
                        order: { storeId },
                        status: 'PAID',
                        updatedAt: { gte: todayStart },
                    },
                }),
                // 현재 처리 중인 주문 (매장이 조치해야 하는 상태)
                this.prisma.order.count({
                    where: {
                        storeId,
                        status: {
                            in: ['PAID', 'CONFIRMED', 'COOKING', 'PREPARING', 'READY', 'DELIVERING'],
                        },
                    },
                }),
                // 품절 처리된 활성 메뉴
                this.prisma.menu.count({
                    where: { storeId, soldOut: true, isActive: true },
                }),
            ]);

        return {
            todayOrderCount,
            todaySales: salesAgg._sum.approvedAmount ?? 0,
            pendingOrderCount,
            soldOutMenuCount,
        };
    }

    private async assertAdmin(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        assertCanCreateStore(user);
    }

    private async assertCanManageStore(userId: string, storeId: string) {
        const [user, store] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.store.findUnique({ where: { id: storeId } }),
        ]);

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        assertCanManageStore(user, store);

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
