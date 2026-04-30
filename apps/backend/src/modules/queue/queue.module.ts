import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueConsumerService } from './queue-consumer.service';
import { QueueService } from './queue.service';

@Module({
    imports: [PrismaModule],
    providers: [QueueService, QueueConsumerService],
    exports: [QueueService, QueueConsumerService],
})
export class QueueModule { }
