import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
    BackendQueueEvent,
    OrderPaidEventPayload,
    QueueEventPayload,
    QueueEventType,
    QueueMessageRecord,
} from './queue-event.types';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);
    private readonly defaultQueueName = process.env.BACKEND_QUEUE_NAME || 'backend_events';

    constructor(private readonly prisma: PrismaService) { }

    async publish<TPayload extends QueueEventPayload>(
        eventType: QueueEventType,
        payload: TPayload,
        options: {
            idempotencyKey: string;
            queueName?: string;
            delaySeconds?: number;
        },
    ): Promise<void> {
        const queueName = options.queueName || this.defaultQueueName;
        const event: BackendQueueEvent<TPayload> = {
            eventId: randomUUID(),
            eventType,
            idempotencyKey: options.idempotencyKey,
            occurredAt: new Date().toISOString(),
            payload,
        };

        await this.send(queueName, event, options.delaySeconds || 0);
    }

    async publishOrderPaid(payload: OrderPaidEventPayload): Promise<void> {
        await this.publish('order.paid', payload, {
            idempotencyKey: `order.paid:${payload.orderId}`,
        });
    }

    async read(
        queueName = this.defaultQueueName,
        visibilityTimeoutSeconds = 60,
        quantity = 10,
    ): Promise<QueueMessageRecord[]> {
        return this.prisma.$queryRawUnsafe(
            'select * from pgmq.read($1, $2, $3)',
            queueName,
            visibilityTimeoutSeconds,
            quantity,
        ) as Promise<QueueMessageRecord[]>;
    }

    async archive(queueName = this.defaultQueueName, messageId: number): Promise<void> {
        await this.prisma.$queryRawUnsafe(
            'select * from pgmq.archive($1, $2)',
            queueName,
            messageId,
        );
    }

    private async send(queueName: string, event: BackendQueueEvent, delaySeconds: number): Promise<void> {
        try {
            await this.prisma.$queryRawUnsafe(
                'select * from pgmq.send($1, $2::jsonb, $3)',
                queueName,
                JSON.stringify(event),
                delaySeconds,
            );
        } catch (error) {
            this.logger.warn(
                `Queue publish failed for ${event.eventType} (${event.idempotencyKey}): ${error.message}`,
            );
        }
    }
}
