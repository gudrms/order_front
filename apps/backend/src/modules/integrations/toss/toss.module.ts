import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TossApiService } from './toss-api.service';
import { MenuSyncService } from './menu-sync.service';
import { TossController } from './toss.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [TossController],
    providers: [TossApiService, MenuSyncService],
    exports: [MenuSyncService],
})
export class TossModule { }
