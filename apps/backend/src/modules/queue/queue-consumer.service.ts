import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BackendQueueEvent, QueueEventPayload, QueueMessageRecord } from './queue-event.types';
import { QueueService } from './queue.service';

@Injectable()
export class QueueConsumerService {
    private readonly logger = new Logger(QueueConsumerService.name);

    constructor(
        private readonly queueService: QueueService,
        private readonly prisma: PrismaService,
    ) { }

    async processOnce(options: {
        queueName?: string;
        visibilityTimeoutSeconds?: number;
        quantity?: number;
    } = {}) {
        const messages = await this.queueService.read(
            options.queueName,
            options.visibilityTimeoutSeconds,
            options.quantity,
        );

        let processedCount = 0;

        for (const record of messages) {
            const queueName = options.queueName || 'backend_events';

            try {
                const event = this.parseEvent(record);
                const log = await this.startProcessing(queueName, record, event);

                if (log.status === 'SUCCEEDED') {
                    await this.queueService.archive(options.queueName, Number(record.msg_id));
                    continue;
                }

                this.logger.log(
                    `Queue event received: ${event.eventType} (${event.idempotencyKey}) msg_id=${record.msg_id} read_ct=${record.read_ct}`,
                );

                await this.queueService.archive(options.queueName, Number(record.msg_id));
                await this.markSucceeded(event.idempotencyKey);
                processedCount += 1;
            } catch (error) {
                await this.markFailed(queueName, record, error);
                this.logger.error(`Queue event processing failed: ${error.message}`);
            }
        }

        return {
            processedCount,
        };
    }

    private parseEvent(record: QueueMessageRecord): BackendQueueEvent<QueueEventPayload> {
        if (typeof record.message === 'string') {
            return JSON.parse(record.message) as BackendQueueEvent<QueueEventPayload>;
        }

        return record.message;
    }

    private async startProcessing(
        queueName: string,
        record: QueueMessageRecord,
        event: BackendQueueEvent<QueueEventPayload>,
    ) {
        const existing = await this.prisma.queueEventLog.findUnique({
            where: { idempotencyKey: event.idempotencyKey },
        });

        if (existing?.status === 'SUCCEEDED') {
            return existing;
        }

        return this.prisma.queueEventLog.upsert({
            where: { idempotencyKey: event.idempotencyKey },
            create: {
                queueName,
                messageId: BigInt(record.msg_id),
                eventId: event.eventId,
                eventType: event.eventType,
                idempotencyKey: event.idempotencyKey,
                status: 'PROCESSING',
                attemptCount: 1,
                payload: this.toJsonPayload(event.payload),
            },
            update: {
                queueName,
                messageId: BigInt(record.msg_id),
                eventId: event.eventId,
                eventType: event.eventType,
                status: 'PROCESSING',
                attemptCount: { increment: 1 },
                payload: this.toJsonPayload(event.payload),
                lastError: null,
            },
        });
    }

    private async markSucceeded(idempotencyKey: string) {
        await this.prisma.queueEventLog.update({
            where: { idempotencyKey },
            data: {
                status: 'SUCCEEDED',
                processedAt: new Date(),
            },
        });
    }

    private async markFailed(queueName: string, record: QueueMessageRecord, error: Error) {
        const fallbackKey = `invalid-message:${queueName}:${record.msg_id}`;

        await this.prisma.queueEventLog.upsert({
            where: { idempotencyKey: fallbackKey },
            create: {
                queueName,
                messageId: BigInt(record.msg_id),
                eventType: 'invalid',
                idempotencyKey: fallbackKey,
                status: 'FAILED',
                attemptCount: 1,
                payload: this.toJsonPayload(record.message),
                lastError: error.message,
            },
            update: {
                status: 'FAILED',
                attemptCount: { increment: 1 },
                payload: this.toJsonPayload(record.message),
                lastError: error.message,
            },
        });
    }

    private toJsonPayload(message: unknown): Prisma.InputJsonValue {
        if (typeof message === 'string') {
            try {
                return JSON.parse(message) as Prisma.InputJsonValue;
            } catch {
                return { raw: message };
            }
        }

        return message as Prisma.InputJsonValue;
    }
}
