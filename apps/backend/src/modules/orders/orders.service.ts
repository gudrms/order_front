import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

    async getOrders(storeId: string, status?: OrderStatus, page: number = 1) {
        const take = 20;
        const skip = (page - 1) * take;

        const where: Prisma.OrderWhereInput = { storeId };
        if (status) {
            where.status = status;
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: orderInclude(),
                orderBy: { createdAt: 'desc' },
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
            throw new NotFoundException(`Order not found: ${orderId}`);
        }
        if (order.storeId !== storeId) {
            throw new BadRequestException('Order does not belong to this store');
        }
        if (order.tossOrderId || order.posSyncStatus === 'SENT') {
            return order;
        }
        if (order.status !== 'PAID') {
            throw new BadRequestException('Only paid orders can be retried for POS sync');
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
        PENDING:          ['CONFIRMED', 'CANCELLED'],
        PENDING_PAYMENT:  ['PAID', 'CANCELLED'],
        PAID:             ['CONFIRMED', 'CANCELLED'],
        CONFIRMED:        ['COOKING', 'PREPARING', 'CANCELLED'],
        COOKING:          ['READY', 'COMPLETED', 'CANCELLED'],
        PREPARING:        ['READY', 'COMPLETED', 'CANCELLED'],
        READY:            ['COMPLETED', 'DELIVERING', 'CANCELLED'],
        DELIVERING:       ['COMPLETED', 'CANCELLED'],
        COMPLETED:        [],
        CANCELLED:        [],
    };

    async updateOrderStatus(storeId: string, orderId: string, status: OrderStatus) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        if (order.storeId !== storeId) {
            throw new BadRequestException('Order does not belong to this store');
        }

        const allowed = OrdersService.ALLOWED_TRANSITIONS[order.status] ?? [];
        if (!allowed.includes(status)) {
            throw new BadRequestException(
                `Invalid status transition: ${order.status} → ${status}`,
            );
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                completedAt: status === 'COMPLETED' ? new Date() : undefined,
                cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
            },
        });
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
            throw new NotFoundException(`Order not found: ${orderId}`);
        }
        if (order.storeId !== storeId) {
            throw new BadRequestException('Order does not belong to this store');
        }
        if (order.type !== 'DELIVERY' || !order.delivery) {
            throw new BadRequestException('Order is not a delivery order');
        }
        if (order.status === 'CANCELLED') {
            throw new BadRequestException('Cancelled orders cannot change delivery status');
        }
        if (order.status === 'COMPLETED' && deliveryStatus !== 'DELIVERED') {
            throw new BadRequestException('Completed orders cannot change delivery status');
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
        if (deliveryStatus === 'PICKED_UP') {
            deliveryUpdateData.pickedUpAt = now;
            orderUpdateData.status = 'DELIVERING';
        }
        if (deliveryStatus === 'DELIVERING') {
            deliveryUpdateData.pickedUpAt = order.delivery.pickedUpAt || now;
            orderUpdateData.status = 'DELIVERING';
        }
        if (deliveryStatus === 'DELIVERED') {
            deliveryUpdateData.deliveredAt = now;
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
            throw new NotFoundException('Store not found');
        }

        assertCanManageStore(user, store);
    }
}
