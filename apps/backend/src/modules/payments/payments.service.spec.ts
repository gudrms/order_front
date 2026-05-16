import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { TossApiService } from '../integrations/toss/toss-api.service';
import { QueueService } from '../queue';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let prisma: any;
    let tossApiService: any;
    let queueService: any;

    const pendingPayment = {
        id: 'payment-1',
        orderId: 'order-1',
        provider: 'TOSS_PAYMENTS',
        providerOrderId: 'ORDER_1',
        idempotencyKey: 'ORDER_1',
        status: 'READY',
        amount: 24000,
        order: {
            id: 'order-1',
            totalAmount: 24000,
            delivery: { id: 'delivery-1' },
        },
    };

    beforeEach(async () => {
        prisma = {
            payment: {
                findFirst: vi.fn(),
                findUnique: vi.fn(),
                findMany: vi.fn(),
                update: vi.fn((args) => ({ model: 'payment', args })),
                updateMany: vi.fn(),
            },
            order: {
                update: vi.fn((args) => ({ model: 'order', args })),
                findUnique: vi.fn(),
            },
            user: {
                findUnique: vi.fn(),
            },
            store: {
                findUnique: vi.fn(),
            },
            $transaction: vi.fn(async (operations) => operations),
        };

        tossApiService = {
            confirmPayment: vi.fn(),
            cancelPayment: vi.fn(),
            fetchPaymentByOrderId: vi.fn(),
            fetchPaymentByPaymentKey: vi.fn(),
        };

        queueService = {
            publishOrderPaid: vi.fn(),
            publishPaymentPaid: vi.fn(),
            publishPaymentReconcile: vi.fn(),
            publishPaymentRefunded: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: PrismaService, useValue: prisma },
                { provide: TossApiService, useValue: tossApiService },
                { provide: QueueService, useValue: queueService },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
    });

    it('confirms a pending Toss payment and marks the order as paid', async () => {
        prisma.payment.findFirst.mockResolvedValue(pendingPayment);
        prisma.payment.updateMany.mockResolvedValue({ count: 1 });
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'PAID',
            paymentStatus: 'PAID',
        });
        tossApiService.confirmPayment.mockResolvedValue({
            method: '카드',
            approvedAt: '2026-04-25T12:00:00+09:00',
            receipt: { url: 'https://receipt.example' },
        });

        const result = await service.confirmTossPayment({
            paymentKey: 'payment-key',
            orderId: 'ORDER_1',
            amount: 24000,
        });

        expect(result).toEqual(expect.objectContaining({ id: 'order-1' }));
        expect(tossApiService.confirmPayment).toHaveBeenCalledWith({
            paymentKey: 'payment-key',
            orderId: 'ORDER_1',
            amount: 24000,
            idempotencyKey: 'ORDER_1',
        });
        expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'payment-1' },
            data: expect.objectContaining({
                status: 'PAID',
                method: 'CARD',
                approvedAmount: 24000,
                receiptUrl: 'https://receipt.example',
            }),
        }));
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: {
                status: 'PAID',
                paymentStatus: 'PAID',
            },
        });
        expect(queueService.publishOrderPaid).toHaveBeenCalledWith({
            orderId: 'order-1',
            storeId: undefined,
            paymentId: 'payment-1',
            providerOrderId: 'ORDER_1',
            amount: 24000,
        });
        expect(queueService.publishPaymentPaid).toHaveBeenCalledWith({
            orderId: 'order-1',
            storeId: undefined,
            paymentId: 'payment-1',
            providerOrderId: 'ORDER_1',
            amount: 24000,
        });
    });

    it('rejects confirmation when the amount does not match the stored order amount', async () => {
        prisma.payment.findFirst.mockResolvedValue(pendingPayment);

        await expect(service.confirmTossPayment({
            paymentKey: 'payment-key',
            orderId: 'ORDER_1',
            amount: 25000,
        })).rejects.toBeInstanceOf(BadRequestException);

        expect(tossApiService.confirmPayment).not.toHaveBeenCalled();
        expect(prisma.payment.update).not.toHaveBeenCalled();
        expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('returns the existing order when the payment is already paid', async () => {
        prisma.payment.findFirst.mockResolvedValue({
            ...pendingPayment,
            status: 'PAID',
        });
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'PAID',
        });

        const result = await service.confirmTossPayment({
            paymentKey: 'payment-key',
            orderId: 'ORDER_1',
            amount: 24000,
        });

        expect(result).toEqual(expect.objectContaining({ status: 'PAID' }));
        expect(tossApiService.confirmPayment).not.toHaveBeenCalled();
    });

    it('records failed Toss payment and cancels delivery order', async () => {
        prisma.payment.findFirst.mockResolvedValue(pendingPayment);
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
        });

        await service.failTossPayment({
            orderId: 'ORDER_1',
            code: 'PAY_PROCESS_CANCELED',
            message: '사용자가 결제를 취소했습니다.',
        });

        expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'payment-1' },
            data: expect.objectContaining({
                status: 'FAILED',
                failureCode: 'PAY_PROCESS_CANCELED',
                failureMessage: '사용자가 결제를 취소했습니다.',
            }),
        }));
        expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'order-1' },
            data: expect.objectContaining({
                status: 'CANCELLED',
                paymentStatus: 'FAILED',
                cancelReason: '사용자가 결제를 취소했습니다.',
                delivery: expect.objectContaining({
                    update: expect.objectContaining({
                        status: 'CANCELLED',
                    }),
                }),
            }),
        }));
        expect(queueService.publishPaymentRefunded).not.toHaveBeenCalled();
    });

    it('records failed Toss payment without delivery update for non-delivery orders', async () => {
        prisma.payment.findFirst.mockResolvedValue({
            ...pendingPayment,
            order: {
                id: 'order-1',
                totalAmount: 24000,
                delivery: null,
            },
        });
        prisma.order.findUnique.mockResolvedValue({ id: 'order-1' });

        await service.failTossPayment({
            orderId: 'ORDER_1',
            code: 'PAYMENT_WIDGET_ABORTED',
        });

        expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.not.objectContaining({
                delivery: expect.anything(),
            }),
        }));
    });

    it('throws not found when no pending Toss payment exists', async () => {
        prisma.payment.findFirst.mockResolvedValue(null);

        await expect(service.confirmTossPayment({
            paymentKey: 'payment-key',
            orderId: 'MISSING_ORDER',
            amount: 24000,
        })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects confirmation for expired or failed payments', async () => {
        prisma.payment.findFirst.mockResolvedValue({
            ...pendingPayment,
            status: 'FAILED',
        });

        await expect(service.confirmTossPayment({
            paymentKey: 'payment-key',
            orderId: 'ORDER_1',
            amount: 24000,
        })).rejects.toBeInstanceOf(BadRequestException);

        expect(tossApiService.confirmPayment).not.toHaveBeenCalled();
    });

    it('expires stale pending Toss payments and cancels delivery orders', async () => {
        prisma.payment.findMany.mockResolvedValue([pendingPayment]);

        const result = await service.expirePendingTossPayments({ olderThanMinutes: 15 });

        expect(result).toEqual({
            expiredCount: 1,
            orderIds: ['order-1'],
        });
        expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                provider: 'TOSS_PAYMENTS',
                status: 'READY',
                order: {
                    status: 'PENDING_PAYMENT',
                },
            }),
        }));
        expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'payment-1' },
            data: expect.objectContaining({
                status: 'FAILED',
                failureCode: 'PAYMENT_TIMEOUT',
            }),
        }));
        expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'order-1' },
            data: expect.objectContaining({
                status: 'CANCELLED',
                paymentStatus: 'FAILED',
                delivery: expect.objectContaining({
                    update: expect.objectContaining({
                        status: 'CANCELLED',
                    }),
                }),
            }),
        }));
    });

    it('queues stale Toss payments for reconciliation', async () => {
        prisma.payment.findMany.mockResolvedValue([
            {
                id: 'payment-1',
                providerOrderId: 'ORDER_1',
            },
            {
                id: 'payment-2',
                providerOrderId: 'ORDER_2',
            },
        ]);

        const result = await service.reconcileTossPayments({ limit: 2 });

        expect(result).toEqual({
            queuedCount: 2,
            paymentIds: ['payment-1', 'payment-2'],
        });
        expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                provider: 'TOSS_PAYMENTS',
                providerOrderId: { not: null },
                status: { in: ['READY', 'PENDING'] },
            },
            orderBy: { requestedAt: 'asc' },
            take: 2,
        }));
        expect(queueService.publishPaymentReconcile).toHaveBeenCalledWith({
            paymentId: 'payment-1',
            providerOrderId: 'ORDER_1',
        });
        expect(queueService.publishPaymentReconcile).toHaveBeenCalledWith({
            paymentId: 'payment-2',
            providerOrderId: 'ORDER_2',
        });
    });

    it('syncs a paid Toss webhook by refetching the payment and marking the order as paid', async () => {
        prisma.payment.findFirst.mockResolvedValue({
            ...pendingPayment,
            order: {
                id: 'order-1',
                storeId: 'store-1',
                totalAmount: 24000,
                delivery: { id: 'delivery-1' },
            },
        });
        tossApiService.fetchPaymentByOrderId.mockResolvedValue({
            orderId: 'ORDER_1',
            paymentKey: 'payment-key',
            status: 'DONE',
            totalAmount: 24000,
            method: '카드',
            approvedAt: '2026-05-16T12:00:00+09:00',
            receipt: { url: 'https://receipt.example/webhook' },
        });

        const result = await service.handleTossWebhook({
            eventType: 'PAYMENT_STATUS_CHANGED',
            data: { orderId: 'ORDER_1' },
        });

        expect(result).toEqual({ handled: true, action: 'MARKED_PAID', orderId: 'order-1' });
        expect(tossApiService.fetchPaymentByOrderId).toHaveBeenCalledWith('ORDER_1');
        expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'payment-1' },
            data: expect.objectContaining({
                status: 'PAID',
                paymentKey: 'payment-key',
                method: 'CARD',
                approvedAmount: 24000,
                receiptUrl: 'https://receipt.example/webhook',
            }),
        }));
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: {
                status: 'PAID',
                paymentStatus: 'PAID',
            },
        });
        expect(queueService.publishPaymentPaid).toHaveBeenCalledWith({
            orderId: 'order-1',
            storeId: 'store-1',
            paymentId: 'payment-1',
            providerOrderId: 'ORDER_1',
            amount: 24000,
        });
    });

    it('syncs a cancelled Toss webhook as a full refund', async () => {
        prisma.payment.findFirst.mockResolvedValue({
            ...pendingPayment,
            status: 'PAID',
            paymentKey: 'payment-key',
            approvedAmount: 24000,
            cancelledAmount: 0,
            order: {
                id: 'order-1',
                storeId: 'store-1',
                totalAmount: 24000,
                delivery: { id: 'delivery-1' },
            },
        });
        tossApiService.fetchPaymentByOrderId.mockResolvedValue({
            orderId: 'ORDER_1',
            paymentKey: 'payment-key',
            status: 'CANCELED',
            totalAmount: 24000,
            cancels: [{ cancelAmount: 24000, canceledAt: '2026-05-16T12:10:00+09:00' }],
        });

        const result = await service.handleTossWebhook({
            eventType: 'CANCEL_STATUS_CHANGED',
            data: { orderId: 'ORDER_1' },
        });

        expect(result).toEqual({ handled: true, action: 'MARKED_REFUNDED', orderId: 'order-1' });
        expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'payment-1' },
            data: expect.objectContaining({
                status: 'REFUNDED',
                cancelledAmount: 24000,
                cancelledAt: expect.any(Date),
            }),
        }));
        expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'order-1' },
            data: expect.objectContaining({
                status: 'CANCELLED',
                paymentStatus: 'REFUNDED',
                delivery: expect.objectContaining({
                    update: expect.objectContaining({
                        status: 'CANCELLED',
                    }),
                }),
            }),
        }));
        expect(queueService.publishPaymentRefunded).toHaveBeenCalledWith({
            paymentId: 'payment-1',
            orderId: 'order-1',
            storeId: 'store-1',
            providerOrderId: 'ORDER_1',
            refundedAmount: 24000,
            totalCancelledAmount: 24000,
            isFullRefund: true,
        });
    });

    it('fully cancels a paid Toss payment and cancels the order', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'owner-1', role: 'OWNER' });
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', ownerId: 'owner-1' });
        prisma.payment.findFirst.mockResolvedValue({
            ...pendingPayment,
            status: 'PAID',
            paymentKey: 'payment-key',
            approvedAmount: 24000,
            cancelledAmount: 0,
            order: {
                id: 'order-1',
                storeId: 'store-1',
                totalAmount: 24000,
                store: { id: 'store-1', ownerId: 'owner-1' },
                delivery: { id: 'delivery-1' },
            },
        });
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED',
            payments: [{ id: 'payment-1', status: 'REFUNDED' }],
        });
        tossApiService.cancelPayment.mockResolvedValue({
            paymentKey: 'payment-key',
            cancels: [{ cancelAmount: 24000 }],
        });

        const result = await service.cancelOrderTossPayment('owner-1', 'order-1', {
            cancelReason: 'customer requested cancellation',
        });

        expect(result).toEqual(expect.objectContaining({
            id: 'order-1',
            paymentStatus: 'REFUNDED',
        }));
        expect(tossApiService.cancelPayment).toHaveBeenCalledWith({
            paymentKey: 'payment-key',
            cancelReason: 'customer requested cancellation',
            cancelAmount: undefined,
            idempotencyKey: 'cancel-payment-1-24000',
        });
        expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'payment-1' },
            data: expect.objectContaining({
                status: 'REFUNDED',
                cancelledAmount: 24000,
                cancelledAt: expect.any(Date),
            }),
        }));
        expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'order-1' },
            data: expect.objectContaining({
                status: 'CANCELLED',
                paymentStatus: 'REFUNDED',
                cancelReason: 'customer requested cancellation',
                delivery: expect.objectContaining({
                    update: expect.objectContaining({
                        status: 'CANCELLED',
                    }),
                }),
            }),
        }));
        expect(queueService.publishPaymentRefunded).toHaveBeenCalledWith({
            paymentId: 'payment-1',
            orderId: 'order-1',
            storeId: 'store-1',
            providerOrderId: 'ORDER_1',
            refundedAmount: 24000,
            totalCancelledAmount: 24000,
            isFullRefund: true,
        });
    });

    it('partially refunds a paid Toss payment without cancelling the order', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', ownerId: 'owner-1' });
        prisma.payment.findFirst.mockResolvedValue({
            ...pendingPayment,
            status: 'PAID',
            paymentKey: 'payment-key',
            approvedAmount: 24000,
            cancelledAmount: 3000,
            order: {
                id: 'order-1',
                storeId: 'store-1',
                totalAmount: 24000,
                store: { id: 'store-1', ownerId: 'owner-1' },
                delivery: { id: 'delivery-1' },
            },
        });
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'PAID',
            paymentStatus: 'PARTIAL_REFUNDED',
        });
        tossApiService.cancelPayment.mockResolvedValue({
            paymentKey: 'payment-key',
            cancels: [{ cancelAmount: 5000 }],
        });

        await service.cancelOrderTossPayment('admin-1', 'order-1', {
            cancelReason: 'delivery fee adjustment',
            cancelAmount: 5000,
        });

        expect(tossApiService.cancelPayment).toHaveBeenCalledWith(expect.objectContaining({
            cancelAmount: 5000,
            idempotencyKey: 'cancel-payment-1-8000',
        }));
        expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'PARTIAL_REFUNDED',
                cancelledAmount: 8000,
            }),
        }));
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            data: {
                paymentStatus: 'PARTIAL_REFUNDED',
            },
        });
        expect(queueService.publishPaymentRefunded).toHaveBeenCalledWith({
            paymentId: 'payment-1',
            orderId: 'order-1',
            storeId: 'store-1',
            providerOrderId: 'ORDER_1',
            refundedAmount: 5000,
            totalCancelledAmount: 8000,
            isFullRefund: false,
        });
    });

    it('rejects refund amounts greater than the remaining paid amount', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'owner-1', role: 'OWNER' });
        prisma.store.findUnique.mockResolvedValue({ id: 'store-1', ownerId: 'owner-1' });
        prisma.payment.findFirst.mockResolvedValue({
            ...pendingPayment,
            status: 'PAID',
            paymentKey: 'payment-key',
            approvedAmount: 24000,
            cancelledAmount: 10000,
            order: {
                id: 'order-1',
                storeId: 'store-1',
                totalAmount: 24000,
                store: { id: 'store-1', ownerId: 'owner-1' },
                delivery: null,
            },
        });

        await expect(service.cancelOrderTossPayment('owner-1', 'order-1', {
            cancelReason: 'too much',
            cancelAmount: 20000,
        })).rejects.toBeInstanceOf(BadRequestException);

        expect(tossApiService.cancelPayment).not.toHaveBeenCalled();
    });
});
