import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TossApiService } from '../integrations/toss/toss-api.service';
import { ConfirmTossPaymentDto, FailTossPaymentDto } from './dto/confirm-toss-payment.dto';

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
}
