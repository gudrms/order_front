import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { TossApiService } from '../integrations/toss/toss-api.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let prisma: any;
    let tossApiService: any;

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
                update: vi.fn((args) => ({ model: 'payment', args })),
            },
            order: {
                update: vi.fn((args) => ({ model: 'order', args })),
                findUnique: vi.fn(),
            },
            $transaction: vi.fn(async (operations) => operations),
        };

        tossApiService = {
            confirmPayment: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: PrismaService, useValue: prisma },
                { provide: TossApiService, useValue: tossApiService },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
    });

    it('confirms a pending Toss payment and marks the order as paid', async () => {
        prisma.payment.findFirst.mockResolvedValue(pendingPayment);
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
                paymentKey: 'payment-key',
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
});
