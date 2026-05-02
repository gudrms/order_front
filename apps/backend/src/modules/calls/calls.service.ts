import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
}
