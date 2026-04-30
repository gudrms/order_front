import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueConsumerService } from './queue-consumer.service';

describe('QueueConsumerService', () => {
    let service: QueueConsumerService;
    let queueService: any;
    let prisma: any;

    beforeEach(() => {
        queueService = {
            read: vi.fn(),
            archive: vi.fn(),
            publishPosSendOrder: vi.fn(),
        };
        prisma = {
            queueEventLog: {
                findUnique: vi.fn(),
                upsert: vi.fn(),
                update: vi.fn(),
            },
            order: {
                updateMany: vi.fn(),
            },
        };
        service = new QueueConsumerService(queueService, prisma);
    });

    it('records queue processing and archives a valid message', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 1,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-1',
                    eventType: 'order.paid',
                    idempotencyKey: 'order.paid:order-1',
                    occurredAt: new Date().toISOString(),
                    payload: { orderId: 'order-1' },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING' });

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 1 });
        expect(prisma.queueEventLog.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { idempotencyKey: 'order.paid:order-1' },
            create: expect.objectContaining({
                status: 'PROCESSING',
                attemptCount: 1,
            }),
        }));
        expect(queueService.archive).toHaveBeenCalledWith(undefined, 1);
        expect(queueService.publishPosSendOrder).toHaveBeenCalledWith({
            orderId: 'order-1',
            storeId: undefined,
        });
        expect(prisma.queueEventLog.update).toHaveBeenCalledWith({
            where: { idempotencyKey: 'order.paid:order-1' },
            data: expect.objectContaining({
                status: 'SUCCEEDED',
                processedAt: expect.any(Date),
            }),
        });
    });

    it('marks POS send jobs as ready for polling', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 4,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-4',
                    eventType: 'pos.send_order',
                    idempotencyKey: 'pos.send_order:order-4',
                    occurredAt: new Date().toISOString(),
                    payload: { orderId: 'order-4' },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING' });
        prisma.order.updateMany.mockResolvedValue({ count: 1 });

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 1 });
        expect(prisma.order.updateMany).toHaveBeenCalledWith({
            where: {
                id: 'order-4',
                status: 'PAID',
                tossOrderId: null,
                posSyncStatus: { in: ['PENDING', 'FAILED'] },
            },
            data: {
                posSyncStatus: 'PENDING',
                posSyncUpdatedAt: expect.any(Date),
            },
        });
        expect(queueService.archive).toHaveBeenCalledWith(undefined, 4);
    });

    it('archives duplicate messages that already succeeded', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 2,
                read_ct: 2,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-2',
                    eventType: 'order.paid',
                    idempotencyKey: 'order.paid:order-2',
                    occurredAt: new Date().toISOString(),
                    payload: { orderId: 'order-2' },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue({ status: 'SUCCEEDED' });

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 0 });
        expect(queueService.archive).toHaveBeenCalledWith(undefined, 2);
        expect(prisma.queueEventLog.upsert).not.toHaveBeenCalled();
    });

    it('records invalid messages as failed without archiving them', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 3,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: '{invalid-json',
            },
        ]);

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 0 });
        expect(prisma.queueEventLog.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { idempotencyKey: 'invalid-message:backend_events:3' },
            create: expect.objectContaining({
                status: 'FAILED',
                lastError: expect.any(String),
            }),
        }));
        expect(queueService.archive).not.toHaveBeenCalled();
    });
});
