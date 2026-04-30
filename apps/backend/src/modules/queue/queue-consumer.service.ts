import { Injectable, Logger } from '@nestjs/common';
import { BackendQueueEvent, QueueEventPayload, QueueMessageRecord } from './queue-event.types';
import { QueueService } from './queue.service';

@Injectable()
export class QueueConsumerService {
    private readonly logger = new Logger(QueueConsumerService.name);

    constructor(private readonly queueService: QueueService) { }

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
            const event = this.parseEvent(record);
            this.logger.log(
                `Queue event received: ${event.eventType} (${event.idempotencyKey}) msg_id=${record.msg_id} read_ct=${record.read_ct}`,
            );

            await this.queueService.archive(options.queueName, Number(record.msg_id));
            processedCount += 1;
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
}

