import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mapTossMethod } from '../../common/utils/toss.utils';
import { assertCanManageStore } from '../../common/auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { TossApiService } from '../integrations/toss/toss-api.service';
import { QueueService } from '../queue';
import { ConfirmTossPaymentDto, ExpirePendingTossPaymentsDto, FailTossPaymentDto, CancelTossPaymentDto, ReconcileTossPaymentsDto, TossWebhookDto } from './dto/confirm-toss-payment.dto';

interface TossPaymentSnapshot {
    orderId?: string;
    paymentKey?: string;
    status?: string;
    totalAmount?: number;
    balanceAmount?: number;
    method?: string;
    approvedAt?: string;
    receipt?: { url?: string };
    cancels?: Array<{ cancelAmount?: number; canceledAt?: string }>;
}

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
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            const errCode = (err as Record<string, unknown>)?.code;

            if (errCode === 'P2002') {
                return this.getOrderResponse(payment.orderId);
            }

            this.logger.error(
                `Local DB commit failed after Toss approval for payment ${payment.id} ` +
                `(paymentKey: ${dto.paymentKey}). Attempting compensation cancel. Error: ${errMsg}`,
            );

            try {
                await this.tossApiService.cancelPayment({
                    paymentKey: dto.paymentKey,
                    cancelReason: 'Local DB confirmation failed - automatic compensation',
                    idempotencyKey: `compensation-${payment.id}-${Date.now()}`,
                });

                try {
                    await this.prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'CANCELLED',
                            cancelledAt: new Date(),
                            failureCode: 'LOCAL_DB_COMMIT_FAILED',
                            failureMessage: `Toss approved but local commit failed: ${errMsg}. Auto-cancelled.`,
                        },
                    });
                } catch (recordError: unknown) {
                    this.logger.error(
                        `Compensation cancel succeeded for payment ${payment.id} but failed to record: ${recordError instanceof Error ? recordError.message : String(recordError)}`,
                    );
                }

                this.logger.warn(
                    `Compensation cancel succeeded for payment ${payment.id}. Customer will not be charged.`,
                );
            } catch (compensationError: unknown) {
                this.logger.error(
                    `CRITICAL: Compensation cancel FAILED for payment ${payment.id} ` +
                    `(paymentKey: ${dto.paymentKey}). Customer may have been charged without order confirmation. ` +
                    `Compensation error: ${compensationError instanceof Error ? compensationError.message : String(compensationError)}. Original error: ${errMsg}`,
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

    async handleTossWebhook(dto: TossWebhookDto) {
        if (dto.eventType !== 'PAYMENT_STATUS_CHANGED' && dto.eventType !== 'CANCEL_STATUS_CHANGED') {
            return {
                handled: false,
                eventType: dto.eventType,
                reason: 'UNSUPPORTED_EVENT_TYPE',
            };
        }

        const eventPayment = dto.data as TossPaymentSnapshot;
        if (!eventPayment.orderId && !eventPayment.paymentKey) {
            this.logger.warn(`Toss webhook ${dto.eventType} skipped: missing orderId and paymentKey`);
            return {
                handled: false,
                eventType: dto.eventType,
                reason: 'MISSING_PAYMENT_IDENTIFIER',
            };
        }

        const tossPayment = eventPayment.orderId
            ? await this.tossApiService.fetchPaymentByOrderId(eventPayment.orderId) as TossPaymentSnapshot
            : await this.tossApiService.fetchPaymentByPaymentKey(eventPayment.paymentKey!) as TossPaymentSnapshot;
        if (tossPayment.status === 'DONE') {
            return this.applyWebhookPaidPayment(tossPayment);
        }

        if (tossPayment.status === 'CANCELED' || tossPayment.status === 'PARTIAL_CANCELED') {
            return this.applyWebhookCancelledPayment(tossPayment);
        }

        if (tossPayment.status === 'ABORTED' || tossPayment.status === 'EXPIRED') {
            return this.applyWebhookFailedPayment(tossPayment);
        }

        return {
            handled: false,
            eventType: dto.eventType,
            orderId: tossPayment.orderId,
            paymentKey: tossPayment.paymentKey,
            tossStatus: tossPayment.status,
            reason: 'NO_LOCAL_STATE_CHANGE',
        };
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

    private async findTossPayment(tossPayment: TossPaymentSnapshot) {
        return this.prisma.payment.findFirst({
            where: {
                provider: 'TOSS_PAYMENTS',
                OR: [
                    ...(tossPayment.orderId ? [{ providerOrderId: tossPayment.orderId }] : []),
                    ...(tossPayment.paymentKey ? [{ paymentKey: tossPayment.paymentKey }] : []),
                ],
            },
            include: {
                order: {
                    include: {
                        delivery: true,
                    },
                },
            },
        });
    }

    private async applyWebhookPaidPayment(tossPayment: TossPaymentSnapshot) {
        const payment = await this.findTossPayment(tossPayment);
        if (!payment) {
            this.logger.warn(`Toss paid webhook skipped: local payment not found for orderId=${tossPayment.orderId}`);
            return { handled: false, reason: 'LOCAL_PAYMENT_NOT_FOUND', orderId: tossPayment.orderId };
        }

        const amount = tossPayment.totalAmount;
        if (typeof amount !== 'number' || payment.amount !== amount || payment.order.totalAmount !== amount) {
            throw new BadRequestException('Webhook payment amount does not match the local order amount');
        }

        if (payment.status === 'PAID') {
            return { handled: true, action: 'ALREADY_PAID', orderId: payment.orderId };
        }
        if (payment.status !== 'READY' && payment.status !== 'PENDING') {
            return { handled: false, reason: 'PAYMENT_NOT_PAYABLE', orderId: payment.orderId, status: payment.status };
        }

        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    method: mapTossMethod(tossPayment.method),
                    paymentKey: tossPayment.paymentKey || payment.paymentKey,
                    approvedAmount: amount,
                    approvedAt: tossPayment.approvedAt ? new Date(tossPayment.approvedAt) : new Date(),
                    receiptUrl: tossPayment.receipt?.url,
                    rawPayload: tossPayment as unknown as Prisma.InputJsonValue,
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

        await this.queueService?.publishPaymentPaid({
            orderId: payment.orderId,
            storeId: payment.order.storeId,
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId || undefined,
            amount,
        });

        await this.queueService?.publishOrderPaid({
            orderId: payment.orderId,
            storeId: payment.order.storeId,
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId || undefined,
            amount,
        });

        return { handled: true, action: 'MARKED_PAID', orderId: payment.orderId };
    }

    private async applyWebhookCancelledPayment(tossPayment: TossPaymentSnapshot) {
        const payment = await this.findTossPayment(tossPayment);
        if (!payment) {
            this.logger.warn(`Toss cancel webhook skipped: local payment not found for orderId=${tossPayment.orderId}`);
            return { handled: false, reason: 'LOCAL_PAYMENT_NOT_FOUND', orderId: tossPayment.orderId };
        }

        const paidAmount = payment.approvedAmount || tossPayment.totalAmount || payment.amount;
        const totalCancelledAmount = this.sumTossCancelledAmount(tossPayment);
        const previousCancelledAmount = payment.cancelledAmount || 0;
        const refundedAmount = Math.max(0, totalCancelledAmount - previousCancelledAmount);
        const isFullRefund = totalCancelledAmount >= paidAmount;
        const nextPaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIAL_REFUNDED';
        const lastCanceledAt = this.getLastTossCanceledAt(tossPayment);
        const now = new Date();

        if (refundedAmount === 0 && payment.status === nextPaymentStatus) {
            return { handled: true, action: 'ALREADY_SYNCED_CANCEL', orderId: payment.orderId };
        }

        const orderUpdateData: Prisma.OrderUpdateInput = {
            paymentStatus: nextPaymentStatus,
            ...(isFullRefund ? {
                status: 'CANCELLED',
                cancelledAt: lastCanceledAt || now,
                cancelReason: 'Toss payment was cancelled',
                ...(payment.order.delivery ? {
                    delivery: { update: { status: 'CANCELLED', cancelledAt: lastCanceledAt || now } },
                } : {}),
            } : {}),
        };

        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: nextPaymentStatus,
                    cancelledAmount: totalCancelledAmount,
                    cancelledAt: isFullRefund ? (lastCanceledAt || now) : payment.cancelledAt,
                    rawPayload: tossPayment as unknown as Prisma.InputJsonValue,
                },
            }),
            this.prisma.order.update({
                where: { id: payment.orderId },
                data: orderUpdateData,
            }),
        ]);

        if (refundedAmount > 0) {
            await this.queueService?.publishPaymentRefunded({
                paymentId: payment.id,
                orderId: payment.orderId,
                storeId: payment.order.storeId,
                providerOrderId: payment.providerOrderId || undefined,
                refundedAmount,
                totalCancelledAmount,
                isFullRefund,
            });
        }

        return { handled: true, action: isFullRefund ? 'MARKED_REFUNDED' : 'MARKED_PARTIAL_REFUNDED', orderId: payment.orderId };
    }

    private async applyWebhookFailedPayment(tossPayment: TossPaymentSnapshot) {
        const payment = await this.findTossPayment(tossPayment);
        if (!payment) {
            this.logger.warn(`Toss failed webhook skipped: local payment not found for orderId=${tossPayment.orderId}`);
            return { handled: false, reason: 'LOCAL_PAYMENT_NOT_FOUND', orderId: tossPayment.orderId };
        }

        if (payment.status !== 'READY' && payment.status !== 'PENDING') {
            return { handled: false, reason: 'PAYMENT_NOT_PENDING', orderId: payment.orderId, status: payment.status };
        }

        const now = new Date();
        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    failedAt: now,
                    failureCode: `TOSS_${tossPayment.status || 'FAILED'}`,
                    failureMessage: `Toss payment status changed to ${tossPayment.status || 'failed'}`,
                    rawPayload: tossPayment as unknown as Prisma.InputJsonValue,
                },
            }),
            this.prisma.order.update({
                where: { id: payment.orderId },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'FAILED',
                    cancelledAt: now,
                    cancelReason: `Toss payment status changed to ${tossPayment.status || 'failed'}`,
                    ...(payment.order.delivery ? {
                        delivery: { update: { status: 'CANCELLED', cancelledAt: now } },
                    } : {}),
                },
            }),
        ]);

        return { handled: true, action: 'MARKED_FAILED', orderId: payment.orderId };
    }

    private sumTossCancelledAmount(tossPayment: TossPaymentSnapshot) {
        return (tossPayment.cancels || []).reduce((sum, cancel) => sum + (cancel.cancelAmount || 0), 0);
    }

    private getLastTossCanceledAt(tossPayment: TossPaymentSnapshot) {
        const latest = (tossPayment.cancels || [])
            .map((cancel) => cancel.canceledAt)
            .filter((value): value is string => !!value)
            .sort()
            .at(-1);

        return latest ? new Date(latest) : undefined;
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
