import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminAccountsService } from './admin-accounts.service';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [AdminAccountsController],
    providers: [AdminAccountsService],
})
export class AdminAccountsModule {}
