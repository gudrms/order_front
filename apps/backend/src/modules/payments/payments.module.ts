import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { TossModule } from '../integrations/toss/toss.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
    imports: [ConfigModule, PrismaModule, TossModule],
    controllers: [PaymentsController],
    providers: [PaymentsService],
})
export class PaymentsModule { }
