import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TossModule } from '../integrations/toss/toss.module';
import { PosModule } from '../integrations/pos/pos.module';
import { QueueController } from './queue.controller';
import { QueueConsumerService } from './queue-consumer.service';
import { QueueService } from './queue.service';
import { NotificationProviderService } from './notification-provider.service';

@Module({
    imports: [PrismaModule, TossModule, PosModule],
    controllers: [QueueController],
    providers: [QueueService, QueueConsumerService, NotificationProviderService],
    exports: [QueueService, QueueConsumerService],
})
export class QueueModule { }
