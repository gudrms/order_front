import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueConsumerService } from './queue-consumer.service';
import { PaymentEventHandler } from './payment-event.handler';
import { PosEventHandler } from './pos-event.handler';
import { NotificationEventHandler } from './notification-event.handler';

describe('QueueConsumerService', () => {
    let service: QueueConsumerService;
    let queueService: any;
    let prisma: any;
    let tossApiService: any;
    let notificationProvider: any;

    beforeEach(() => {
        queueService = {
            read: vi.fn(),
            archive: vi.fn(),
            publishPosSendOrder: vi.fn(),
            publishNotificationSend: vi.fn(),
            retry: vi.fn(),
            publishOrderPaid: vi.fn(),
            publishPaymentPaid: vi.fn(),
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
                update: vi.fn(),
            },
            order: {
                findFirst: vi.fn(),
                update: vi.fn((args) => ({ model: 'order', args })),
            },
            payment: {
                findFirst: vi.fn(),
                update: vi.fn((args) => ({ model: 'payment', args })),
            },
            store: {
                findUnique: vi.fn().mockResolvedValue({ menuManagementMode: 'TOSS_POS' }),
            },
            $transaction: vi.fn(async (operations) => operations),
        };
        tossApiService = {
            fetchPaymentByOrderId: vi.fn(),
        };
        notificationProvider = {
            send: vi.fn(),
        };

        const paymentEventHandler = new PaymentEventHandler(queueService, prisma, tossApiService);
        const posEventHandler = new PosEventHandler(prisma);
        const notificationEventHandler = new NotificationEventHandler(prisma, notificationProvider, queueService);

        service = new QueueConsumerService(
            queueService,
            prisma,
            paymentEventHandler,
            posEventHandler,
            notificationEventHandler,
        );
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
        // storeId가 없으면 모드 조회 없이 바로 POS 전송 발행
        expect(queueService.publishPosSendOrder).toHaveBeenCalledWith({
            orderId: 'order-1',
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

    it('publishes POS and notification when a TOSS_POS store order is paid', async () => {
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
        prisma.store.findUnique.mockResolvedValue({ menuManagementMode: 'TOSS_POS' });

        await service.processOnce();

        expect(prisma.store.findUnique).toHaveBeenCalledWith({
            where: { id: 'store-1' },
            select: { menuManagementMode: true },
        });
        expect(queueService.publishPosSendOrder).toHaveBeenCalledWith({
            orderId: 'order-5',
            storeId: 'store-1',
        });
        expect(queueService.publishNotificationSend).toHaveBeenCalledWith({
            recipientType: 'STORE',
            recipientId: 'store-1',
            notificationType: 'ORDER_PAID',
            orderId: 'order-5',
            storeId: 'store-1',
            channel: 'IN_APP',
        });
    });

    it('skips POS send but still notifies when an ADMIN_DIRECT store order is paid', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 6,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-6',
                    eventType: 'order.paid',
                    idempotencyKey: 'order.paid:order-6',
                    occurredAt: new Date().toISOString(),
                    payload: { orderId: 'order-6', storeId: 'store-admin' },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING' });
        prisma.store.findUnique.mockResolvedValue({ menuManagementMode: 'ADMIN_DIRECT' });

        await service.processOnce();

        expect(queueService.publishPosSendOrder).not.toHaveBeenCalled();
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-6' },
            data: expect.objectContaining({ posSyncStatus: 'SKIPPED' }),
        });
        expect(queueService.publishNotificationSend).toHaveBeenCalledWith(
            expect.objectContaining({ orderId: 'order-6', storeId: 'store-admin' }),
        );
    });

    it('keeps POS jobs pending for the Toss POS plugin polling flow', async () => {
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
        prisma.order.findFirst.mockResolvedValue({
            id: 'order-4',
            status: 'PAID',
            tossOrderId: null,
            posSyncStatus: 'PENDING',
            store: { menuManagementMode: 'TOSS_POS' },
            items: [],
            payments: [],
        });

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 1 });
        expect(prisma.order.findFirst).toHaveBeenCalledWith({
            where: {
                id: 'order-4',
                status: 'PAID',
                tossOrderId: null,
                posSyncStatus: { in: ['PENDING', 'FAILED'] },
            },
            include: {
                store: true,
                items: {
                    include: {
                        selectedOptions: true,
                    },
                },
                delivery: true,
                payments: true,
            },
        });
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-4' },
            data: expect.objectContaining({
                posSyncStatus: 'PENDING',
                posSyncLastError: null,
                posSyncUpdatedAt: expect.any(Date),
            }),
        });
        expect(queueService.archive).toHaveBeenCalledWith(undefined, 4);
    });

    it('skips POS send and marks SKIPPED for ADMIN_DIRECT store on pos.send_order', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 20,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-20',
                    eventType: 'pos.send_order',
                    idempotencyKey: 'pos.send_order:order-20',
                    occurredAt: new Date().toISOString(),
                    payload: { orderId: 'order-20' },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING' });
        prisma.order.findFirst.mockResolvedValue({
            id: 'order-20',
            storeId: 'store-admin',
            status: 'PAID',
            tossOrderId: null,
            posSyncStatus: 'PENDING',
            store: { menuManagementMode: 'ADMIN_DIRECT' },
            items: [],
            payments: [],
        });

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 1 });
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-20' },
            data: expect.objectContaining({ posSyncStatus: 'SKIPPED' }),
        });
    });

    it('sends notification jobs and records success with a dedupe key', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 6,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-6',
                    eventType: 'notification.send',
                    idempotencyKey: 'notification.send:store-1:ORDER_PAID:order-6:IN_APP',
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
        notificationProvider.send.mockResolvedValue({ provider: 'in_app' });

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 1 });
        expect(prisma.notificationLog.upsert).toHaveBeenCalledWith({
            where: { dedupeKey: 'store-1:ORDER_PAID:order-6:IN_APP' },
            create: expect.objectContaining({
                recipientType: 'STORE',
                recipientId: 'store-1',
                notificationType: 'ORDER_PAID',
                orderId: 'order-6',
                storeId: 'store-1',
                channel: 'IN_APP',
                status: 'PENDING',
                lastError: null,
            }),
            update: expect.objectContaining({
                status: 'PENDING',
                lastError: null,
            }),
        });
        expect(notificationProvider.send).toHaveBeenCalledWith(expect.objectContaining({
            recipientType: 'STORE',
            notificationType: 'ORDER_PAID',
            orderId: 'order-6',
        }));
        expect(prisma.notificationLog.update).toHaveBeenCalledWith({
            where: { dedupeKey: 'store-1:ORDER_PAID:order-6:IN_APP' },
            data: {
                status: 'SENT',
                sentAt: expect.any(Date),
                lastError: 'in_app',
            },
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
                    idempotencyKey: 'notification.send:store-1:ORDER_PAID:order-7:IN_APP',
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

    it('records notification provider failures and retries the message', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 12,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-12',
                    eventType: 'notification.send',
                    idempotencyKey: 'notification.send:store-1:ORDER_PAID:order-12:IN_APP',
                    occurredAt: new Date().toISOString(),
                    payload: {
                        recipientType: 'STORE',
                        recipientId: 'store-1',
                        notificationType: 'ORDER_PAID',
                        orderId: 'order-12',
                    },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING', attemptCount: 1 });
        prisma.queueEventLog.update.mockResolvedValue({ attemptCount: 1 });
        prisma.notificationLog.findUnique.mockResolvedValue(null);
        notificationProvider.send.mockRejectedValue(new Error('provider timeout'));

        const result = await service.processOnce();

        expect(result).toEqual({ processedCount: 0 });
        expect(prisma.notificationLog.update).toHaveBeenCalledWith({
            where: { dedupeKey: 'store-1:ORDER_PAID:order-12:IN_APP' },
            data: {
                status: 'FAILED',
                lastError: 'provider timeout',
            },
        });
        expect(queueService.retry).toHaveBeenCalledWith(
            expect.objectContaining({
                eventType: 'notification.send',
                idempotencyKey: 'notification.send:store-1:ORDER_PAID:order-12:IN_APP',
            }),
            {
                queueName: 'backend_events',
                delaySeconds: 10,
            },
        );
    });

    it('reconciles a Toss payment that is paid remotely but not locally', async () => {
        queueService.read.mockResolvedValue([
            {
                msg_id: 10,
                read_ct: 1,
                enqueued_at: new Date(),
                vt: new Date(),
                message: {
                    eventId: 'event-10',
                    eventType: 'payment.reconcile',
                    idempotencyKey: 'payment.reconcile:payment-10',
                    occurredAt: new Date().toISOString(),
                    payload: { paymentId: 'payment-10', providerOrderId: 'ORDER_10' },
                },
            },
        ]);
        prisma.queueEventLog.findUnique.mockResolvedValue(null);
        prisma.queueEventLog.upsert.mockResolvedValue({ status: 'PROCESSING' });
        prisma.payment.findFirst.mockResolvedValue({
            id: 'payment-10',
            orderId: 'order-10',
            provider: 'TOSS_PAYMENTS',
            providerOrderId: 'ORDER_10',
            paymentKey: null,
            status: 'READY',
            amount: 24000,
            order: {
                id: 'order-10',
                storeId: 'store-10',
                paymentStatus: 'PENDING',
            },
        });
        tossApiService.fetchPaymentByOrderId.mockResolvedValue({
            status: 'DONE',
            paymentKey: 'payment-key-10',
            method: '카드',
            totalAmount: 24000,
            approvedAt: '2026-05-01T06:00:00+09:00',
            receipt: { url: 'https://receipt.example/10' },
        });

        await service.processOnce();

        expect(tossApiService.fetchPaymentByOrderId).toHaveBeenCalledWith('ORDER_10');
        expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'payment-10' },
            data: expect.objectContaining({
                status: 'PAID',
                paymentKey: 'payment-key-10',
                method: 'CARD',
                approvedAmount: 24000,
                receiptUrl: 'https://receipt.example/10',
            }),
        }));
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-10' },
            data: {
                status: 'PAID',
                paymentStatus: 'PAID',
            },
        });
        expect(queueService.publishOrderPaid).toHaveBeenCalledWith({
            orderId: 'order-10',
            storeId: 'store-10',
            paymentId: 'payment-10',
            providerOrderId: 'ORDER_10',
            amount: 24000,
        });
        expect(queueService.publishPaymentPaid).toHaveBeenCalledWith({
            orderId: 'order-10',
            storeId: 'store-10',
            paymentId: 'payment-10',
            providerOrderId: 'ORDER_10',
            amount: 24000,
        });
        expect(queueService.archive).toHaveBeenCalledWith(undefined, 10);
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
