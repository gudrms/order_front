import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TableStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCallDto } from './dto/create-call.dto';

@Injectable()
export class CallsService {
    constructor(private readonly prisma: PrismaService) { }

    async createCall(storeId: string, tableNumber: number, dto: CreateCallDto) {
        const [store, table] = await Promise.all([
            this.prisma.store.findUnique({ where: { id: storeId } }),
            this.prisma.table.findUnique({
                where: {
                    storeId_tableNumber: {
                        storeId,
                        tableNumber,
                    },
                },
            }),
        ]);

        if (!store || !store.isActive) {
            throw new NotFoundException('Store not found or inactive');
        }
        if (!table) {
            throw new NotFoundException('Table not found');
        }
        if (table.status === TableStatus.RESERVED) {
            throw new BadRequestException('Table is reserved');
        }

        return this.prisma.staffCall.create({
            data: {
                storeId,
                tableNumber,
                callType: dto.type,
            },
        });
    }

    /**
     * 처리 대기/진행 중인 직원 호출 목록 (관리자용)
     */
    async getPendingCalls(userId: string, storeId: string) {
        await this.assertCanManageCalls(userId, storeId);

        return this.prisma.staffCall.findMany({
            where: {
                storeId,
                status: { in: ['PENDING', 'PROCESSING'] },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * 직원 호출 완료 처리
     */
    async completeCall(userId: string, storeId: string, callId: string) {
        await this.assertCanManageCalls(userId, storeId);

        const call = await this.prisma.staffCall.findFirst({
            where: { id: callId, storeId },
        });
        if (!call) throw new NotFoundException('Call not found');

        return this.prisma.staffCall.update({
            where: { id: callId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
    }

    private async assertCanManageCalls(userId: string, storeId: string) {
        const [user, store] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.store.findUnique({ where: { id: storeId } }),
        ]);
        if (!store) throw new NotFoundException('Store not found');
        if (user?.role !== 'ADMIN' && store.ownerId !== userId) {
            throw new ForbiddenException('Access denied');
        }
    }
}
