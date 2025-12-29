import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Prisma connected to database');
        } catch (error) {
            this.logger.error('❌ Failed to connect to database:', error.message);
            this.logger.warn('⚠️ Server will start without database connection. Check network/firewall settings.');
            // 서버는 시작하도록 에러를 무시
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
