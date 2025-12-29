import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoresService {
    constructor(private readonly prisma: PrismaService) { }

    async getStore(storeId: string) {
        return this.prisma.store.findUnique({
            where: { id: storeId },
        });
    }
}
