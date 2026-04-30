import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TossModule } from '../integrations/toss/toss.module';
import { PosModule } from '../integrations/pos/pos.module';
import { QueueController } from './queue.controller';
import { QueueConsumerService } from './queue-consumer.service';
import { QueueService } from './queue.service';

@Module({
    imports: [PrismaModule, TossModule, PosModule],
    controllers: [QueueController],
    providers: [QueueService, QueueConsumerService],
    exports: [QueueService, QueueConsumerService],
})
export class QueueModule { }
