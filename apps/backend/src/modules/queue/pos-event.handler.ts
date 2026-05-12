import { Injectable, Logger, Optional } from '@nestjs/common';
import { MenuManagementMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ResilientPosService } from '../integrations/pos/pos.resilience';
import { BackendQueueEvent, QueueEventPayload } from './queue-event.types';

@Injectable()
export class PosEventHandler {
    private readonly logger = new Logger(PosEventHandler.name);

    constructor(
        private readonly prisma: PrismaService,
        @Optional() private readonly resilientPosService?: ResilientPosService,
    ) { }

    async handlePosSendOrder(event: BackendQueueEvent<QueueEventPayload>) {
        const orderId = String(event.payload.orderId || '');
        if (!orderId) {
            throw new Error('pos.send_order payload requires orderId');
        }

        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
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

        if (!order) {
            return;
        }

        // ADMIN_DIRECT 모드 매장은 POS 기기가 없으므로 전송하지 않고 SKIPPED 처리
        if (order.store?.menuManagementMode !== MenuManagementMode.TOSS_POS) {
            this.logger.log(
                `[pos.send_order] store ${order.storeId} is ADMIN_DIRECT — skipping POS send for orderId=${orderId}`,
            );
            await this.prisma.order.update({
                where: { id: orderId },
                data: { posSyncStatus: 'SKIPPED', posSyncUpdatedAt: new Date() },
            });
            return;
        }

        // Circuit Breaker: POS 가용성 확인. breaker가 OPEN이면 false를 반환하며,
        // 이 경우 예외를 던져 queue backoff retry로 위임한다.
        if (this.resilientPosService) {
            const available = await this.resilientPosService.sendOrder({ orderNumber: order.orderNumber });
            if (!available) {
                throw new Error(`POS unavailable (Circuit Breaker OPEN) — orderId=${orderId} queued for retry`);
            }
        }

        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                posSyncStatus: 'PENDING',
                posSyncLastError: null,
                posSyncUpdatedAt: new Date(),
            },
        });
    }
}
