import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TossModule } from '../integrations/toss/toss.module';
import { PosModule } from '../integrations/pos/pos.module';
import { QueueController } from './queue.controller';
import { QueueOperationsController } from './queue-operations.controller';
import { QueueConsumerService } from './queue-consumer.service';
import { QueueOperationsService } from './queue-operations.service';
import { QueueService } from './queue.service';
import { NotificationProviderService } from './notification-provider.service';

@Module({
    imports: [PrismaModule, TossModule, PosModule],
    controllers: [QueueController, QueueOperationsController],
    providers: [QueueService, QueueConsumerService, QueueOperationsService, NotificationProviderService],
    exports: [QueueService, QueueConsumerService],
})
export class QueueModule { }
