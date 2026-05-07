import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueService } from './queue.service';

describe('QueueService', () => {
    let prisma: any;
    let service: QueueService;

    beforeEach(() => {
        prisma = {
            $queryRawUnsafe: vi.fn(),
            queueEventLog: {
                upsert: vi.fn(),
            },
        };
        service = new QueueService(prisma);
    });

    it('casts pgmq.read arguments to the extension signature', async () => {
        prisma.$queryRawUnsafe.mockResolvedValue([]);

        await service.read('backend_events', 60, 10);

        expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
            'select * from pgmq.read($1::text, $2::integer, $3::integer)',
            'backend_events',
            60,
            10,
        );
    });

    it('casts pgmq.archive message id as bigint', async () => {
        prisma.$queryRawUnsafe.mockResolvedValue([]);

        await service.archive('backend_events', 125);

        expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
            'select * from pgmq.archive($1::text, $2::bigint)',
            'backend_events',
            125,
        );
    });

    it('casts pgmq.send delay as integer', async () => {
        prisma.$queryRawUnsafe.mockResolvedValue([]);

        await service.publishOrderPaid({
            orderId: 'order-1',
            storeId: 'store-1',
            paymentId: 'payment-1',
            amount: 10000,
        });

        expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
            'select * from pgmq.send($1::text, $2::jsonb, $3::integer)',
            'backend_events',
            expect.any(String),
            0,
        );
    });
});
