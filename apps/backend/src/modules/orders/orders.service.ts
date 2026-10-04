import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, OrderStatus, DeliveryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ResilientPosService } from '../integrations/pos/pos.resilience';
import { SessionsService } from '../sessions/sessions.service';
import { QueueService } from '../queue';
import { assertCanManageStore } from '../../common/auth/permissions';
import { orderInclude, prepareOrderItems, generateOrderNumber } from './order-helpers';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly posService: ResilientPosService,
        private readonly sessionsService: SessionsService,
        private readonly queueService: QueueService,
    ) { }

    async createFirstOrder(storeId: string, tableNumber: number, dto: CreateOrderDto) {
        const session = await this.sessionsService.startSession(storeId, tableNumber);
        const order = await this.createOrder(storeId, session.id, dto);

        return {
            session,
            order,
        };
    }

    async createOrder(storeId: string, sessionId: string, dto: CreateOrderDto) {
        const session = await this.sessionsService.getSessionById(sessionId);

        const order = await this.prisma.$transaction(async (tx) => {
            const { totalPrice, orderItemsData } = await prepareOrderItems(tx, storeId, dto.items);

            return tx.order.create({
                data: {
                    storeId,
                    sessionId,
                    tableNumber: session.tableNumber,
                    orderNumber: await generateOrderNumber(tx, storeId),
                    type: 'TABLE',
                    source: 'TABLE_ORDER',
                    status: 'PENDING',
                    totalAmount: totalPrice,
                    tossOrderId: dto.tossOrderId,
                    items: {
                        create: orderItemsData.map((item) => ({
                            menuId: item.menuId,
                            menuName: item.menuName,
                            menuPrice: item.menuPrice,
                            quantity: item.quantity,
                            totalPrice: item.totalPrice,
                            selectedOptions: item.selectedOptions,
                        })),
                    },
                },
                include: orderInclude(),
            });
        });

        await this.sessionsService.updateSessionTotal(sessionId, order.totalAmount);

        return order;
    }

    async getOrders(storeId: string, status?: OrderStatus, page: number = 1, filters: { startDate?: string; endDate?: string; state?: string } = {}) {
        if (!Number.isInteger(page) || page < 1) throw new BadRequestException('페이지는 1 이상이어야 합니다');
        if (filters.state && !['all', 'active', 'cancelled', 'completed'].includes(filters.state)) throw new BadRequestException('올바르지 않은 주문 상태 필터입니다');
        const parseDate = (value: string) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException('날짜 형식은 YYYY-MM-DD이어야 합니다');
            const date = new Date(`${value}T00:00:00+09:00`);
            if (Number.isNaN(date.getTime()) || new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10) !== value) throw new BadRequestException('유효하지 않은 날짜입니다');
            return date;
        };
        const start = filters.startDate ? parseDate(filters.startDate) : undefined;
        const end = filters.endDate ? parseDate(filters.endDate) : undefined;
        if (start && end && start > end) throw new BadRequestException('시작일은 종료일 이후일 수 없습니다');
        const take = 20;
        const skip = (page - 1) * take;

        const dateWhere: Prisma.OrderWhereInput = { storeId, ...(start || end ? { createdAt: { ...(start ? { gte: start } : {}), ...(end ? { lt: new Date(end.getTime() + 24 * 60 * 60 * 1000) } : {}) } } : {}) };
        const where: Prisma.OrderWhereInput = { ...dateWhere };
        if (filters.state === 'active') where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
        if (filters.state === 'cancelled') where.status = 'CANCELLED';
        if (filters.state === 'completed') where.status = 'COMPLETED';
        if (status) {
            where.status = status;
        }

        const [orders, total, all, active, cancelled, completed] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: orderInclude(),
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.order.count({ where }),
            this.prisma.order.count({ where: dateWhere }),
            this.prisma.order.count({ where: { ...dateWhere, status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
            this.prisma.order.count({ where: { ...dateWhere, status: 'CANCELLED' } }),
            this.prisma.order.count({ where: { ...dateWhere, status: 'COMPLETED' } }),
        ]);

        return {
            data: orders,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / take),
                counts: { all, active, cancelled, completed },
            },
        };
    }

    async getPosSyncFailures(storeId: string, page: number = 1, userId?: string) {
        if (userId) {
            await this.assertCanManageStore(userId, storeId);
        }

        const take = 20;
        const skip = (page - 1) * take;
        const where: Prisma.OrderWhereInput = {
            storeId,
            posSyncStatus: 'FAILED',
        };

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: orderInclude(),
                orderBy: { posSyncUpdatedAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            data: orders,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / take),
            },
        };
    }

    async retryPosSync(storeId: string, orderId: string, userId?: string) {
        if (userId) {
            await this.assertCanManageStore(userId, storeId);
        }

        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('주문을 찾을 수 없습니다');
        }
        if (order.storeId !== storeId) {
            throw new BadRequestException('이 매장의 주문이 아닙니다');
        }
        if (order.tossOrderId || order.posSyncStatus === 'SENT') {
            return order;
        }
        if (order.status !== 'PAID') {
            throw new BadRequestException('결제 완료된 주문만 POS 재전송할 수 있습니다');
        }

        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                posSyncStatus: 'PENDING',
                posSyncLastError: null,
                posSyncUpdatedAt: new Date(),
            },
        });

        await this.queueService.publishPosSendOrder({
            orderId,
            storeId,
        });

        return updated;
    }

    private static readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
        // 관리자 '접수'는 바로 조리 중(COOKING)으로 보낸다. CONFIRMED는 POS 등 기존 흐름용으로 남긴다
        PENDING:          ['CONFIRMED', 'COOKING', 'CANCELLED'],
        PENDING_PAYMENT:  ['PAID', 'CANCELLED'],
        PAID:             ['CONFIRMED', 'COOKING', 'CANCELLED'],
        CONFIRMED:        ['COOKING', 'PREPARING', 'CANCELLED'],
        COOKING:          ['READY', 'COMPLETED', 'CANCELLED'],
        PREPARING:        ['READY', 'COMPLETED', 'CANCELLED'],
        READY:            ['COMPLETED', 'DELIVERING', 'CANCELLED'],
        DELIVERING:       ['COMPLETED', 'CANCELLED'],
        COMPLETED:        [],
        CANCELLED:        [],
    };

    async updateOrderStatus(
        storeId: string,
        orderId: string,
        status: OrderStatus,
        options: { estimatedMinutes?: number } = {},
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { delivery: { select: { id: true } } },
        });

        if (!order) {
            throw new NotFoundException('주문을 찾을 수 없습니다');
        }

        if (order.storeId !== storeId) {
            throw new BadRequestException('이 매장의 주문이 아닙니다');
        }

        const allowed = OrdersService.ALLOWED_TRANSITIONS[order.status] ?? [];
        if (!allowed.includes(status)) {
            throw new BadRequestException(
                `${order.status} → ${status} 로는 상태를 바꿀 수 없습니다`,
            );
        }

        // 접수(결제 완료 → 접수/조리 중) 시 매장이 정한 배달 예상 시간을 저장한다 (주문 시점엔 매장 기본값이 들어가 있다)
        const { estimatedMinutes } = options;
        const isAccepting = (order.status === 'PAID' || order.status === 'PENDING') && (status === 'CONFIRMED' || status === 'COOKING');
        const shouldSetEstimate = isAccepting && estimatedMinutes != null && !!order.delivery;
        if (shouldSetEstimate && (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 5 || estimatedMinutes > 180)) {
            throw new BadRequestException('예상 시간은 5분에서 180분 사이로 정해 주세요');
        }

        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                completedAt: status === 'COMPLETED' ? new Date() : undefined,
                cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
                delivery: shouldSetEstimate ? { update: { estimatedMinutes } } : undefined,
            },
        });

        if (order.userId) {
            await this.notifyCustomerStatusChanged(order.userId, storeId, orderId, status, {
                isAccepting,
                estimatedMinutes: shouldSetEstimate ? estimatedMinutes : undefined,
            });
        }

        return updated;
    }

    /** 고객에게 보낼 주문 상태 알림 문구 (알림이 필요 없는 상태는 null) */
    private static customerStatusMessage(
        status: OrderStatus,
        { isAccepting, estimatedMinutes }: { isAccepting: boolean; estimatedMinutes?: number },
    ): { title: string; body: string } | null {
        // 접수는 고객이 가장 기다리는 소식이라 예상 시간을 같이 보낸다
        if (isAccepting) {
            return {
                title: '🌮 주문이 접수되었어요',
                body: estimatedMinutes
                    ? `주문이 접수되어 조리를 시작했어요. 약 ${estimatedMinutes}분 후 도착 예정이에요.`
                    : '주문이 접수되어 조리를 시작했어요.',
            };
        }
        const messages: Partial<Record<OrderStatus, { title: string; body: string }>> = {
            COOKING: { title: '🌮 조리를 시작했어요', body: '주문하신 메뉴를 조리하고 있어요.' },
            PREPARING: { title: '🌮 조리를 시작했어요', body: '주문하신 메뉴를 준비하고 있어요.' },
            READY: { title: '🌮 메뉴가 준비되었어요', body: '주문하신 메뉴가 모두 준비되었어요.' },
            DELIVERING: { title: '🛵 배달을 시작했어요', body: '주문하신 메뉴가 출발했어요.' },
            COMPLETED: { title: '🌮 주문이 완료되었어요', body: '맛있게 드세요!' },
            CANCELLED: { title: '주문이 취소되었어요', body: '매장 사정으로 주문이 취소되었어요.' },
        };
        return messages[status] ?? null;
    }

    /** 매장이 주문 상태를 바꾸면 고객 앱에 알린다 */
    private async notifyCustomerStatusChanged(
        userId: string,
        storeId: string,
        orderId: string,
        status: OrderStatus,
        options: { isAccepting: boolean; estimatedMinutes?: number },
    ) {
        const message = OrdersService.customerStatusMessage(status, options);
        if (!message) return;
        const notificationType = status === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_CONFIRMED';
        try {
            await this.queueService.publishNotificationSend({
                recipientType: 'CUSTOMER',
                recipientId: userId,
                notificationType,
                orderId,
                storeId,
                orderStatus: status,
                channel: 'IN_APP',
            });
            await this.queueService.publishNotificationSend({
                recipientType: 'CUSTOMER',
                recipientId: userId,
                notificationType,
                orderId,
                storeId,
                orderStatus: status,
                channel: 'PUSH',
                ...message,
            });
        } catch (error) {
            // 알림 실패가 상태 변경 자체를 막으면 안 된다
            this.logger.error(`Failed to publish order status notification for ${orderId}`, error as Error);
        }
    }

    async updateDeliveryStatus(
        storeId: string,
        orderId: string,
        deliveryStatus: DeliveryStatus,
        options: { riderMemo?: string } = {},
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { delivery: true },
        });

        if (!order) {
            throw new NotFoundException('주문을 찾을 수 없습니다');
        }
        if (order.storeId !== storeId) {
            throw new BadRequestException('이 매장의 주문이 아닙니다');
        }
        if (order.type !== 'DELIVERY' || !order.delivery) {
            throw new BadRequestException('배달 주문이 아닙니다');
        }
        if (order.status === 'CANCELLED') {
            throw new BadRequestException('취소된 주문은 배달 상태를 바꿀 수 없습니다');
        }
        if (order.status === 'COMPLETED' && deliveryStatus !== 'DELIVERED') {
            throw new BadRequestException('완료된 주문은 배달 상태를 바꿀 수 없습니다');
        }
        // 결제된 주문을 배달 취소만으로 종료하면 돈은 그대로 둔 채 주문만 취소된다.
        // 결제 취소(환불)는 payments 경로에서 처리해야 하므로 여기서는 막는다.
        if (deliveryStatus === 'CANCELLED' && order.paymentStatus === 'PAID') {
            throw new BadRequestException(
                '결제 완료된 주문은 환불이 함께 처리되도록 결제 취소 화면에서 취소해야 합니다',
            );
        }

        const now = new Date();
        const deliveryUpdateData: Prisma.OrderDeliveryUpdateInput = {
            status: deliveryStatus,
            riderMemo: options.riderMemo?.trim() || undefined,
        };
        const orderUpdateData: Prisma.OrderUpdateInput = {
            delivery: { update: deliveryUpdateData },
        };

        if (deliveryStatus === 'ASSIGNED') {
            deliveryUpdateData.assignedAt = now;
        }
        // 배달 상태로 주문 상태를 덮어쓸 때도 주문 상태 전이 규칙을 지켜야 한다.
        // (예: 조리 시작 전 주문이 픽업 처리되어 COOKING/READY를 건너뛰는 것 방지)
        const assertOrderTransition = (next: OrderStatus) => {
            if (order.status === next) return;
            const allowed = OrdersService.ALLOWED_TRANSITIONS[order.status] ?? [];
            if (!allowed.includes(next)) {
                throw new BadRequestException(
                    `배달 상태 ${deliveryStatus}는 주문 상태 ${next}가 필요한데, ${order.status} → ${next} 전환이 허용되지 않습니다`,
                );
            }
        };

        if (deliveryStatus === 'PICKED_UP') {
            deliveryUpdateData.pickedUpAt = now;
            assertOrderTransition('DELIVERING');
            orderUpdateData.status = 'DELIVERING';
        }
        if (deliveryStatus === 'DELIVERING') {
            deliveryUpdateData.pickedUpAt = order.delivery.pickedUpAt || now;
            assertOrderTransition('DELIVERING');
            orderUpdateData.status = 'DELIVERING';
        }
        if (deliveryStatus === 'DELIVERED') {
            deliveryUpdateData.deliveredAt = now;
            assertOrderTransition('COMPLETED');
            orderUpdateData.status = 'COMPLETED';
            orderUpdateData.completedAt = now;
        }
        if (deliveryStatus === 'CANCELLED') {
            deliveryUpdateData.cancelledAt = now;
            orderUpdateData.status = 'CANCELLED';
            orderUpdateData.cancelledAt = now;
            orderUpdateData.cancelReason = options.riderMemo?.trim() || 'Delivery cancelled by store';
        }

        const previousDeliveryStatus = order.delivery.status;

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: orderUpdateData,
            include: orderInclude(),
        });

        // DB commit 후 delivery.status_changed 이벤트 발행
        await this.queueService.publishDeliveryStatusChanged({
            orderId,
            storeId,
            userId: order.userId || undefined,
            previousStatus: previousDeliveryStatus,
            newStatus: deliveryStatus,
        });

        return updatedOrder;
    }

    private async assertCanManageStore(userId: string, storeId: string) {
        const [user, store] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.store.findUnique({ where: { id: storeId } }),
        ]);

        if (!store) {
            throw new NotFoundException('매장을 찾을 수 없습니다');
        }

        assertCanManageStore(user, store);
    }
}
