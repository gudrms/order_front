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
            publishNotificationSend: vi.fn(),
            retry: vi.fn(),
        };
        prisma = {
            queueEventLog: {
                findUnique: vi.fn(),
                upsert: vi.fn(),
                update: vi.fn(),
            },
            notificationLog: {
                findUnique: vi.fn(),
                upsert: vi.fn(),
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
        expect(queueService.publishNotificationSend).not.toHaveBeenCalled();
        expect(prisma.queueEventLog.update).toHaveBeenCalledWith({
            where: { idempotencyKey: 'order.paid:order-1' },
            data: expect.objectContaining({
                status: 'SUCCEEDED',
                processedAt: expect.any(Date),
            }),
        });
    });

    it('publishes a store notification when a paid order has a store id', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 5,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-5',
                    eventType: 'order.paid',
                    idempotencyKey: 'order.paid:order-5',
                    occurredAt: new Date().toISOString(),
                    payload: { orderId: 'order-5', storeId: 'store-1' },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING' });

        await service.processOnce();

        expect(queueService.publishNotificationSend).toHaveBeenCalledWith({
            recipientType: 'STORE',
            recipientId: 'store-1',
            notificationType: 'ORDER_PAID',
            orderId: 'order-5',
            storeId: 'store-1',
            channel: 'IN_APP',
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

    it('records notification send jobs with a dedupe key', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 6,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-6',
                    eventType: 'notification.send',
                    idempotencyKey: 'notification.send:store-1:ORDER_PAID:order-6',
                    occurredAt: new Date().toISOString(),
                    payload: {
                        recipientType: 'STORE',
                        recipientId: 'store-1',
                        notificationType: 'ORDER_PAID',
                        orderId: 'order-6',
                        storeId: 'store-1',
                    },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING' });
        prisma.notificationLog.findUnique.mockResolvedValue(null);

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 1 });
        expect(prisma.notificationLog.upsert).toHaveBeenCalledWith({
            where: { dedupeKey: 'store-1:ORDER_PAID:order-6' },
            create: expect.objectContaining({
                recipientType: 'STORE',
                recipientId: 'store-1',
                notificationType: 'ORDER_PAID',
                orderId: 'order-6',
                storeId: 'store-1',
                channel: 'IN_APP',
                status: 'SKIPPED',
            }),
            update: expect.objectContaining({
                status: 'SKIPPED',
            }),
        });
        expect(queueService.archive).toHaveBeenCalledWith(undefined, 6);
    });

    it('skips notification jobs that were already sent', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 7,
                read_ct: 2,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-7',
                    eventType: 'notification.send',
                    idempotencyKey: 'notification.send:store-1:ORDER_PAID:order-7',
                    occurredAt: new Date().toISOString(),
                    payload: {
                        recipientType: 'STORE',
                        recipientId: 'store-1',
                        notificationType: 'ORDER_PAID',
                        orderId: 'order-7',
                    },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING' });
        prisma.notificationLog.findUnique.mockResolvedValue({ status: 'SENT' });

        await service.processOnce();

        expect(prisma.notificationLog.upsert).not.toHaveBeenCalled();
        expect(queueService.archive).toHaveBeenCalledWith(undefined, 7);
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

    it('retries failed jobs with backoff and archives the current message', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 8,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-8',
                    eventType: 'pos.send_order',
                    idempotencyKey: 'pos.send_order:order-8',
                    occurredAt: new Date().toISOString(),
                    payload: {},
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING', attemptCount: 2 });
        prisma.queueEventLog.update.mockResolvedValue({ attemptCount: 2 });

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 0 });
        expect(prisma.queueEventLog.update).toHaveBeenCalledWith({
            where: { idempotencyKey: 'pos.send_order:order-8' },
            data: {
                status: 'FAILED',
                lastError: 'pos.send_order payload requires orderId',
            },
            select: { attemptCount: true },
        });
        expect(queueService.retry).toHaveBeenCalledWith(
            expect.objectContaining({
                eventType: 'pos.send_order',
                idempotencyKey: 'pos.send_order:order-8',
            }),
            {
                queueName: 'backend_events',
                delaySeconds: 30,
            },
        );
        expect(queueService.archive).toHaveBeenCalledWith(undefined, 8);
    });

    it('archives failed jobs when retry attempts are exhausted', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 9,
                read_ct: 5,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-9',
                    eventType: 'pos.send_order',
                    idempotencyKey: 'pos.send_order:order-9',
                    occurredAt: new Date().toISOString(),
                    payload: {},
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING', attemptCount: 5 });
        prisma.queueEventLog.update.mockResolvedValue({ attemptCount: 5 });

        await service.processOnce();

        expect(queueService.retry).not.toHaveBeenCalled();
        expect(queueService.archive).toHaveBeenCalledWith(undefined, 9);
    });
});
