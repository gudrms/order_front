import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mapTossMethod } from '../../common/utils/toss.utils';
import { assertCanManageStore } from '../../common/auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { TossApiService } from '../integrations/toss/toss-api.service';
import { QueueService } from '../queue';
import { ConfirmTossPaymentDto, ExpirePendingTossPaymentsDto, FailTossPaymentDto, CancelTossPaymentDto, ReconcileTossPaymentsDto } from './dto/confirm-toss-payment.dto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly tossApiService: TossApiService,
        @Optional() private readonly queueService?: QueueService,
    ) { }

    async confirmTossPayment(dto: ConfirmTossPaymentDto) {
        const payment = await this.prisma.payment.findFirst({
            where: {
                provider: 'TOSS_PAYMENTS',
                providerOrderId: dto.orderId,
            },
            include: {
                order: {
                    include: {
                        delivery: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException(`Pending payment not found: ${dto.orderId}`);
        }

        if (payment.amount !== dto.amount || payment.order.totalAmount !== dto.amount) {
            throw new BadRequestException('Payment amount does not match the order amount');
        }

        if (payment.status === 'PAID') {
            return this.getOrderResponse(payment.orderId);
        }
        if (payment.status !== 'READY' && payment.status !== 'PENDING') {
            throw new BadRequestException('Payment is not confirmable');
        }

        // Atomic claim: only one concurrent request proceeds when paymentKey is not yet set.
        // paymentKey has @unique — if two requests race past the status check above,
        // the second DB write will throw P2002 and we handle it below.
        const claimed = await this.prisma.payment.updateMany({
            where: {
                id: payment.id,
                paymentKey: null,
                status: { in: ['READY', 'PENDING'] },
            },
            data: { paymentKey: dto.paymentKey },
        });

        if (claimed.count === 0) {
            // Another concurrent request already claimed this paymentKey.
            // If it finished, return the confirmed order; otherwise surface a conflict.
            const current = await this.prisma.payment.findUnique({ where: { id: payment.id } });
            if (current?.status === 'PAID') return this.getOrderResponse(payment.orderId);
            throw new ConflictException('Payment confirmation already in progress');
        }

        const tossPayment = await this.tossApiService.confirmPayment({
            paymentKey: dto.paymentKey,
            orderId: dto.orderId,
            amount: dto.amount,
            idempotencyKey: payment.idempotencyKey || dto.orderId,
        });

        try {
            await this.prisma.$transaction([
                this.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'PAID',
                        method: mapTossMethod(tossPayment?.method),
                        approvedAmount: dto.amount,
                        approvedAt: tossPayment?.approvedAt ? new Date(tossPayment.approvedAt) : new Date(),
                        receiptUrl: tossPayment?.receipt?.url,
                        rawPayload: tossPayment,
                    },
                }),
                this.prisma.order.update({
                    where: { id: payment.orderId },
                    data: {
                        status: 'PAID',
                        paymentStatus: 'PAID',
                    },
                }),
            ]);
        } catch (err: any) {
            if (err?.code === 'P2002') {
                // Unique constraint race — another request already completed confirmation.
                return this.getOrderResponse(payment.orderId);
            }

            // 핵심 안전 규칙: Toss 승인은 성공했지만 로컬 DB 확정이 실패한 상태.
            // 고객의 돈이 빠져나갔으나 주문이 확정되지 않았으므로 즉시 보상 취소를 시도한다.
            this.logger.error(
                `Local DB commit failed after Toss approval for payment ${payment.id} ` +
                `(paymentKey: ${dto.paymentKey}). Attempting compensation cancel. Error: ${err.message}`,
            );

            try {
                await this.tossApiService.cancelPayment({
                    paymentKey: dto.paymentKey,
                    cancelReason: 'Local DB confirmation failed - automatic compensation',
                    idempotencyKey: `compensation-${payment.id}-${Date.now()}`,
                });

                // 보상 취소 성공: Payment를 CANCELLED로 기록 (best-effort)
                try {
                    await this.prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'CANCELLED',
                            cancelledAt: new Date(),
                            failureCode: 'LOCAL_DB_COMMIT_FAILED',
                            failureMessage: `Toss approved but local commit failed: ${err.message}. Auto-cancelled.`,
                        },
                    });
                } catch (recordError: any) {
                    this.logger.error(
                        `Compensation cancel succeeded for payment ${payment.id} but failed to record: ${recordError.message}`,
                    );
                }

                this.logger.warn(
                    `Compensation cancel succeeded for payment ${payment.id}. Customer will not be charged.`,
                );
            } catch (compensationError: any) {
                // 보상 취소마저 실패 — 최악의 상황. reconciliation job이 복구하도록 한다.
                this.logger.error(
                    `CRITICAL: Compensation cancel FAILED for payment ${payment.id} ` +
                    `(paymentKey: ${dto.paymentKey}). Customer may have been charged without order confirmation. ` +
                    `Compensation error: ${compensationError.message}. Original error: ${err.message}`,
                );
            }

            throw err;
        }

        await this.queueService?.publishPaymentPaid({
            orderId: payment.orderId,
            storeId: payment.order.storeId,
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId || undefined,
            amount: dto.amount,
        });

        await this.queueService?.publishOrderPaid({
            orderId: payment.orderId,
            storeId: payment.order.storeId,
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId || undefined,
            amount: dto.amount,
        });

        return this.getOrderResponse(payment.orderId);
    }

    async failTossPayment(dto: FailTossPaymentDto) {
        const payment = await this.prisma.payment.findFirst({
            where: {
                provider: 'TOSS_PAYMENTS',
                providerOrderId: dto.orderId,
            },
            include: {
                order: {
                    include: {
                        delivery: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException(`Pending payment not found: ${dto.orderId}`);
        }

        if (payment.status === 'PAID') {
            return this.getOrderResponse(payment.orderId);
        }
        if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
            return this.getOrderResponse(payment.orderId);
        }

        const orderUpdateData: Prisma.OrderUpdateInput = {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            cancelledAt: new Date(),
            cancelReason: dto.message || dto.code || 'Toss payment failed',
            ...(payment.order.delivery ? {
                delivery: { update: { status: 'CANCELLED', cancelledAt: new Date() } },
            } : {}),
        };

        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    failedAt: new Date(),
                    failureCode: dto.code,
                    failureMessage: dto.message,
                    rawPayload: dto as unknown as Prisma.InputJsonValue,
                },
            }),
            this.prisma.order.update({
                where: { id: payment.orderId },
                data: orderUpdateData,
            }),
        ]);

        return this.getOrderResponse(payment.orderId);
    }

    async failPendingTossPayment(orderId: string, code?: string, message?: string) {
        return this.failTossPayment({ orderId, code, message });
    }

    async expirePendingTossPayments(dto: ExpirePendingTossPaymentsDto = {}) {
        const olderThanMinutes = dto.olderThanMinutes || 15;
        const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
        const expiredPayments = await this.prisma.payment.findMany({
            where: {
                provider: 'TOSS_PAYMENTS',
                status: 'READY',
                requestedAt: { lt: cutoff },
                order: {
                    status: 'PENDING_PAYMENT',
                },
            },
            include: {
                order: {
                    include: {
                        delivery: true,
                    },
                },
            },
        });

        const operations = expiredPayments.flatMap((payment) => {
            const orderUpdateData: Prisma.OrderUpdateInput = {
                status: 'CANCELLED',
                paymentStatus: 'FAILED',
                cancelledAt: new Date(),
                cancelReason: 'Payment timed out before approval',
                ...(payment.order.delivery ? {
                    delivery: { update: { status: 'CANCELLED', cancelledAt: new Date() } },
                } : {}),
            };

            return [
                this.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'FAILED',
                        failedAt: new Date(),
                        failureCode: 'PAYMENT_TIMEOUT',
                        failureMessage: `Payment was not approved within ${olderThanMinutes} minutes`,
                    },
                }),
                this.prisma.order.update({
                    where: { id: payment.orderId },
                    data: orderUpdateData,
                }),
            ];
        });

        if (operations.length > 0) {
            await this.prisma.$transaction(operations);
        }

        return {
            expiredCount: expiredPayments.length,
            orderIds: expiredPayments.map((payment) => payment.orderId),
        };
    }

    async reconcileTossPayments(dto: ReconcileTossPaymentsDto = {}) {
        const limit = dto.limit || 50;
        const payments = await this.prisma.payment.findMany({
            where: {
                provider: 'TOSS_PAYMENTS',
                providerOrderId: { not: null },
                status: { in: ['READY', 'PENDING'] },
            },
            orderBy: { requestedAt: 'asc' },
            take: limit,
        });

        await Promise.all(payments.map((payment) => this.queueService?.publishPaymentReconcile({
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId || undefined,
        })));

        return {
            queuedCount: payments.length,
            paymentIds: payments.map((payment) => payment.id),
        };
    }

    async cancelOrderTossPayment(userId: string, orderId: string, dto: CancelTossPaymentDto) {
        const payment = await this.prisma.payment.findFirst({
            where: {
                orderId,
                provider: 'TOSS_PAYMENTS',
            },
            include: {
                order: {
                    include: {
                        store: true,
                        delivery: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!payment) {
            throw new NotFoundException(`Toss payment not found for order: ${orderId}`);
        }

        await this.assertCanManageStore(userId, payment.order.storeId);

        if (payment.status !== 'PAID' && payment.status !== 'PARTIAL_REFUNDED') {
            throw new BadRequestException('Only paid Toss payments can be cancelled');
        }
        if (!payment.paymentKey) {
            throw new BadRequestException('Payment key is missing');
        }

        const paidAmount = payment.approvedAmount || payment.amount;
        const alreadyCancelledAmount = payment.cancelledAmount || 0;
        const remainingAmount = paidAmount - alreadyCancelledAmount;
        if (remainingAmount <= 0) {
            return this.getOrderResponse(orderId);
        }

        const cancelAmount = dto.cancelAmount || remainingAmount;
        if (cancelAmount > remainingAmount) {
            throw new BadRequestException('Cancel amount exceeds remaining paid amount');
        }

        const isFullRefund = cancelAmount === remainingAmount;
        const cancelReason = dto.cancelReason.trim();
        const tossPayment = await this.tossApiService.cancelPayment({
            paymentKey: payment.paymentKey,
            cancelReason,
            cancelAmount: isFullRefund ? undefined : cancelAmount,
            idempotencyKey: `cancel-${payment.id}-${alreadyCancelledAmount + cancelAmount}`,
        });

        const now = new Date();
        const nextCancelledAmount = alreadyCancelledAmount + cancelAmount;
        const nextPaymentStatus = nextCancelledAmount >= paidAmount ? 'REFUNDED' : 'PARTIAL_REFUNDED';
        const orderUpdateData: Prisma.OrderUpdateInput = {
            paymentStatus: nextPaymentStatus,
            ...(nextPaymentStatus === 'REFUNDED' ? {
                status: 'CANCELLED',
                cancelledAt: now,
                cancelReason: cancelReason,
                ...(payment.order.delivery ? {
                    delivery: { update: { status: 'CANCELLED', cancelledAt: now } },
                } : {}),
            } : {}),
        };

        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: nextPaymentStatus,
                    cancelledAmount: nextCancelledAmount,
                    cancelledAt: nextPaymentStatus === 'REFUNDED' ? now : payment.cancelledAt,
                    rawPayload: tossPayment,
                },
            }),
            this.prisma.order.update({
                where: { id: orderId },
                data: orderUpdateData,
            }),
        ]);

        await this.queueService?.publishPaymentRefunded({
            paymentId: payment.id,
            orderId,
            storeId: payment.order.storeId,
            providerOrderId: payment.providerOrderId || undefined,
            refundedAmount: cancelAmount,
            totalCancelledAmount: nextCancelledAmount,
            isFullRefund,
        });

        return this.getOrderResponse(orderId);
    }

    // mapTossMethod는 common/utils/toss.utils.ts로 이동됨

    private async getOrderResponse(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                delivery: true,
                payments: true,
                items: {
                    include: {
                        selectedOptions: true,
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        return order;
    }

    private async assertCanManageStore(userId: string, storeId: string) {
        const [user, store] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.store.findUnique({ where: { id: storeId } }),
        ]);

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        assertCanManageStore(user, store);
    }
}
