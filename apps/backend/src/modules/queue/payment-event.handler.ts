import { Injectable, Logger } from '@nestjs/common';
import { MenuManagementMode } from '@prisma/client';
import { mapTossMethod } from '../../common/utils/toss.utils';
import { PrismaService } from '../prisma/prisma.service';
import { TossApiService } from '../integrations/toss/toss-api.service';
import { QueueService } from './queue.service';
import {
    BackendQueueEvent,
    PaymentReconcileEventPayload,
    QueueEventPayload,
} from './queue-event.types';

@Injectable()
export class PaymentEventHandler {
    private readonly logger = new Logger(PaymentEventHandler.name);

    constructor(
        private readonly queueService: QueueService,
        private readonly prisma: PrismaService,
        private readonly tossApiService: TossApiService,
    ) { }

    async handleOrderPaid(event: BackendQueueEvent<QueueEventPayload>) {
        const orderId = String(event.payload.orderId || '');
        if (!orderId) {
            throw new Error('order.paid payload requires orderId');
        }

        const storeId = typeof event.payload.storeId === 'string' ? event.payload.storeId : undefined;

        // TOSS_POS 모드 매장만 POS 전송 큐 발행. ADMIN_DIRECT 매장은 POS 기기가 없으므로 skip.
        if (storeId) {
            const store = await this.prisma.store.findUnique({
                where: { id: storeId },
                select: { menuManagementMode: true },
            });
            if (store?.menuManagementMode === MenuManagementMode.TOSS_POS) {
                await this.queueService.publishPosSendOrder({ orderId, storeId });
            } else {
                this.logger.log(
                    `[order.paid] storeId=${storeId} is ADMIN_DIRECT — skipping pos.send_order for orderId=${orderId}`,
                );
                await this.prisma.order.update({
                    where: { id: orderId },
                    data: { posSyncStatus: 'SKIPPED', posSyncUpdatedAt: new Date() },
                });
            }
        } else {
            // storeId 없으면 안전하게 POS 전송 시도
            await this.queueService.publishPosSendOrder({ orderId });
        }

        if (storeId) {
            await this.queueService.publishNotificationSend({
                recipientType: 'STORE',
                recipientId: storeId,
                notificationType: 'ORDER_PAID',
                orderId,
                storeId,
                channel: 'IN_APP',
            });
            await this.queueService.publishNotificationSend({
                recipientType: 'STORE',
                recipientId: storeId,
                notificationType: 'ORDER_PAID',
                orderId,
                storeId,
                channel: 'PUSH',
                title: '🌮 새로운 주문 접수!',
                body: '새로운 배달 주문이 들어왔습니다. 확인해주세요.',
            });
        }
    }

    async handlePaymentReconcile(event: BackendQueueEvent<PaymentReconcileEventPayload>) {
        if (!event.payload.paymentId && !event.payload.providerOrderId) {
            throw new Error('payment.reconcile requires paymentId or providerOrderId');
        }

        const payment = await this.prisma.payment.findFirst({
            where: {
                provider: 'TOSS_PAYMENTS',
                OR: [
                    ...(event.payload.paymentId ? [{ id: event.payload.paymentId }] : []),
                    ...(event.payload.providerOrderId ? [{ providerOrderId: event.payload.providerOrderId }] : []),
                ],
            },
            include: { order: true },
        });

        if (!payment) {
            throw new Error('payment.reconcile target payment not found');
        }
        if (!payment.providerOrderId) {
            throw new Error('payment.reconcile requires providerOrderId');
        }
        if (payment.status === 'PAID' && payment.order.paymentStatus === 'PAID') {
            return;
        }

        const tossPayment = await this.tossApiService.fetchPaymentByOrderId(payment.providerOrderId);
        if (tossPayment?.status !== 'DONE') {
            return;
        }

        const approvedAmount = tossPayment?.totalAmount || tossPayment?.balanceAmount || payment.amount;

        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    paymentKey: tossPayment?.paymentKey || payment.paymentKey,
                    method: mapTossMethod(tossPayment?.method),
                    approvedAmount,
                    approvedAt: tossPayment?.approvedAt ? new Date(tossPayment.approvedAt) : new Date(),
                    receiptUrl: tossPayment?.receipt?.url,
                    rawPayload: tossPayment,
                },
            }),
            this.prisma.order.update({
                where: { id: payment.orderId },
                data: { status: 'PAID', paymentStatus: 'PAID' },
            }),
        ]);

        await this.queueService.publishPaymentPaid({
            orderId: payment.orderId,
            storeId: payment.order.storeId,
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId,
            amount: approvedAmount,
        });

        await this.queueService.publishOrderPaid({
            orderId: payment.orderId,
            storeId: payment.order.storeId,
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId,
            amount: approvedAmount,
        });
    }
}
