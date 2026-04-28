import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TossApiService } from '../integrations/toss/toss-api.service';
import { ConfirmTossPaymentDto, ExpirePendingTossPaymentsDto, FailTossPaymentDto, CancelTossPaymentDto } from './dto/confirm-toss-payment.dto';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tossApiService: TossApiService,
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

        const tossPayment = await this.tossApiService.confirmPayment({
            paymentKey: dto.paymentKey,
            orderId: dto.orderId,
            amount: dto.amount,
            idempotencyKey: payment.idempotencyKey || dto.orderId,
        });

        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    method: this.mapTossMethod(tossPayment?.method),
                    paymentKey: dto.paymentKey,
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

        const orderUpdateData: any = {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            cancelledAt: new Date(),
            cancelReason: dto.message || dto.code || 'Toss payment failed',
        };

        if (payment.order.delivery) {
            orderUpdateData.delivery = {
                update: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                },
            };
        }

        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    failedAt: new Date(),
                    failureCode: dto.code,
                    failureMessage: dto.message,
                    rawPayload: dto as any,
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
            const orderUpdateData: any = {
                status: 'CANCELLED',
                paymentStatus: 'FAILED',
                cancelledAt: new Date(),
                cancelReason: 'Payment timed out before approval',
            };

            if (payment.order.delivery) {
                orderUpdateData.delivery = {
                    update: {
                        status: 'CANCELLED',
                        cancelledAt: new Date(),
                    },
                };
            }

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
        const orderUpdateData: any = {
            paymentStatus: nextPaymentStatus,
        };

        if (nextPaymentStatus === 'REFUNDED') {
            orderUpdateData.status = 'CANCELLED';
            orderUpdateData.cancelledAt = now;
            orderUpdateData.cancelReason = cancelReason;
            if (payment.order.delivery) {
                orderUpdateData.delivery = {
                    update: {
                        status: 'CANCELLED',
                        cancelledAt: now,
                    },
                };
            }
        }

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

        return this.getOrderResponse(orderId);
    }

    private mapTossMethod(method?: string) {
        if (!method) {
            return 'TOSS';
        }

        return method === '카드' || method.toLowerCase().includes('card') ? 'CARD' : 'TOSS';
    }

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

        if (!user || (user.role !== 'ADMIN' && store.ownerId !== userId)) {
            throw new ForbiddenException('You do not have permission to manage this store');
        }
    }
}
