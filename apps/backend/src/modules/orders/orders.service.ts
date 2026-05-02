import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryOrderDto, CreateOrderDto } from './dto/create-order.dto';
import { ResilientPosService } from '../integrations/pos/pos.resilience';
import { SessionsService } from '../sessions/sessions.service';
import { QueueService } from '../queue';
import { assertCanManageStore } from '../../common/auth/permissions';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly posService: ResilientPosService,
        private readonly sessionsService: SessionsService,
        private readonly queueService?: QueueService,
        private readonly couponsService?: CouponsService,
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
            const { totalPrice, orderItemsData } = await this.prepareOrderItems(tx, storeId, dto.items);

            return tx.order.create({
                data: {
                    storeId,
                    sessionId,
                    tableNumber: session.tableNumber,
                    orderNumber: await this.generateOrderNumber(tx, storeId),
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
                include: this.orderInclude(),
            });
        });

        await this.sessionsService.updateSessionTotal(sessionId, order.totalAmount);

        return order;
    }

    async createDeliveryOrder(storeId: string, dto: CreateDeliveryOrderDto) {
        return this.prisma.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { id: storeId },
            });

            if (!store) {
                throw new NotFoundException(`Store not found: ${storeId}`);
            }
            if (!store.isActive) {
                throw new BadRequestException('Store is not active');
            }
            if (!store.isDeliveryEnabled) {
                throw new BadRequestException('Store is not accepting delivery orders');
            }
            if (!dto.userId) {
                throw new BadRequestException('Delivery orders require an authenticated user');
            }
            const paymentMethod = dto.payment.method as string | undefined;
            if (paymentMethod === 'CASH' || dto.payment.paymentKey?.startsWith('CASH_')) {
                throw new BadRequestException('Delivery orders only support prepaid Toss Payments');
            }

            const { totalPrice, orderItemsData } = await this.prepareOrderItems(tx, storeId, dto.items);
            if (totalPrice < store.minimumOrderAmount) {
                throw new BadRequestException(`Minimum order amount is ${store.minimumOrderAmount}`);
            }

            const deliveryFee = store.freeDeliveryThreshold && totalPrice >= store.freeDeliveryThreshold
                ? 0
                : store.deliveryFee;
            const expectedAmount = totalPrice + deliveryFee;

            let discountAmount = 0;
            if (dto.userCouponId && !dto.userId) {
                throw new BadRequestException('Coupons require an authenticated user');
            }
            if (dto.userCouponId && dto.userId && this.couponsService) {
                const result = await this.couponsService.validateAndCalculateDiscount(
                    dto.userId,
                    dto.userCouponId,
                    expectedAmount,
                );
                discountAmount = result.discountAmount;
            }
            const finalAmount = expectedAmount - discountAmount;

            if (dto.totalAmount !== expectedAmount || dto.payment.amount !== finalAmount) {
                throw new BadRequestException('Order amount does not match current menu and delivery fee');
            }

            const order = await tx.order.create({
                data: {
                    storeId,
                    userId: dto.userId,
                    orderNumber: await this.generateOrderNumber(tx, storeId),
                    type: 'DELIVERY',
                    source: 'DELIVERY_APP',
                    status: 'PENDING_PAYMENT',
                    paymentStatus: 'READY',
                    totalAmount: finalAmount,
                    discountAmount,
                    ...(dto.userCouponId ? { userCouponId: dto.userCouponId } : {}),
                    note: dto.delivery.deliveryMemo,
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
                    delivery: {
                        create: {
                            addressId: dto.delivery.addressId,
                            recipientName: dto.delivery.recipientName,
                            recipientPhone: dto.delivery.recipientPhone,
                            address: dto.delivery.address,
                            detailAddress: dto.delivery.detailAddress,
                            zipCode: dto.delivery.zipCode,
                            deliveryMemo: dto.delivery.deliveryMemo,
                            deliveryFee,
                            estimatedMinutes: store.estimatedDeliveryMinutes,
                        },
                    },
                    payments: {
                        create: {
                            provider: 'TOSS_PAYMENTS',
                            method: 'TOSS',
                            status: 'READY',
                            amount: finalAmount,
                            paymentKey: dto.payment.paymentKey,
                            providerOrderId: dto.payment.orderId,
                            idempotencyKey: dto.payment.orderId,
                            rawPayload: dto.payment as any,
                        },
                    },
                },
                include: this.orderInclude(),
            });

            if (dto.userCouponId && this.couponsService) {
                await this.couponsService.markAsUsed(tx, dto.userCouponId, order.id);
            }

            return order;
        });
    }

    private async prepareOrderItems(tx: any, storeId: string, items: any[]) {
        if (!items?.length) {
            throw new BadRequestException('Order must include at least one item');
        }

        const menuIds = items.map((item) => item.menuId);
        const menus = await tx.menu.findMany({
            where: { id: { in: menuIds }, storeId },
            include: { optionGroups: { include: { options: true } } },
        });

        let totalPrice = 0;
        const orderItemsData = [];

        for (const itemDto of items) {
            const menu = menus.find((m) => m.id === itemDto.menuId);
            if (!menu) {
                throw new NotFoundException(`Menu not found: ${itemDto.menuId}`);
            }
            if (!menu.isActive || menu.soldOut) {
                throw new BadRequestException(`Menu is not available: ${menu.name}`);
            }

            let itemPrice = menu.price;
            const itemOptionsData = [];

            if (itemDto.options) {
                for (const optDto of itemDto.options) {
                    if (!optDto.optionId) {
                        throw new BadRequestException('Option ID is required for server-side price validation');
                    }

                    const option = menu.optionGroups
                        .flatMap((group) => group.options)
                        .find((candidate) => candidate.id === optDto.optionId);

                    if (!option) {
                        throw new NotFoundException(`Option not found: ${optDto.optionId}`);
                    }
                    if (option.isSoldOut) {
                        throw new BadRequestException(`Option is sold out: ${option.name}`);
                    }

                    itemPrice += option.price;

                    const optionGroup = menu.optionGroups.find((group) => group.id === option.optionGroupId);
                    itemOptionsData.push({
                        menuOptionGroupId: optionGroup?.id,
                        menuOptionId: option.id,
                        optionGroupName: optionGroup?.name || 'Unknown',
                        optionName: option.name,
                        optionPrice: option.price,
                    });
                }
            }

            totalPrice += itemPrice * itemDto.quantity;

            orderItemsData.push({
                menuId: menu.id,
                menuName: menu.name,
                menuPrice: menu.price,
                quantity: itemDto.quantity,
                totalPrice: itemPrice * itemDto.quantity,
                selectedOptions: {
                    create: itemOptionsData.map((option) => ({
                        menuOptionGroupId: option.menuOptionGroupId,
                        menuOptionId: option.menuOptionId,
                        optionGroupName: option.optionGroupName,
                        optionName: option.optionName,
                        optionPrice: option.optionPrice,
                    })),
                },
            });
        }

        return { totalPrice, orderItemsData };
    }

    private async generateOrderNumber(tx: any, storeId: string): Promise<string> {
        const count = await tx.order.count({
            where: { storeId },
        });
        return String(count + 1).padStart(4, '0');
    }

    async getOrders(storeId: string, status?: any, page: number = 1) {
        const take = 20;
        const skip = (page - 1) * take;

        const where: any = { storeId };
        if (status) {
            where.status = status;
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: this.orderInclude(),
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
        const where: any = {
            storeId,
            posSyncStatus: 'FAILED',
        };

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: this.orderInclude(),
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

        await this.queueService?.publishPosSendOrder({
            orderId,
            storeId,
        });

        return updated;
    }

    async getDeliveryOrders(params: { storeId?: string; userId?: string; page?: number }) {
        if (!params.userId) {
            throw new BadRequestException('userId is required to lookup delivery orders');
        }

        const take = 20;
        const page = params.page || 1;
        const skip = (page - 1) * take;
        const where: any = {
            type: 'DELIVERY',
        };

        if (params.storeId) {
            where.storeId = params.storeId;
        }
        if (params.userId) {
            where.userId = params.userId;
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: this.orderInclude(),
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

    async getOrderById(orderId: string, lookup?: { userId?: string }) {
        if (!lookup?.userId) {
            throw new BadRequestException('userId is required to lookup a delivery order');
        }

        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: this.orderInclude(),
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        if (order.userId !== lookup.userId) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        return order;
    }

    async cancelDeliveryOrder(orderId: string, params: { userId?: string; reason?: string }) {
        if (!params.userId) {
            throw new BadRequestException('userId is required to cancel a delivery order');
        }

        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: this.orderInclude(),
            });

            if (!order || order.type !== 'DELIVERY' || order.userId !== params.userId) {
                throw new NotFoundException(`Order not found: ${orderId}`);
            }

            if (order.status === 'CANCELLED') {
                return order;
            }

            if (order.paymentStatus === 'PAID') {
                throw new BadRequestException('Paid delivery orders require refund approval before cancellation');
            }

            const cancellableStatuses = ['PENDING_PAYMENT', 'PENDING'];
            if (!cancellableStatuses.includes(order.status)) {
                throw new BadRequestException('This order can no longer be cancelled by the customer');
            }

            const now = new Date();
            const reason = params.reason?.trim() || 'Cancelled by customer before payment approval';

            await tx.payment.updateMany({
                where: {
                    orderId,
                    status: { in: ['READY', 'PENDING'] },
                },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: now,
                },
            });

            return tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'CANCELLED',
                    cancelledAt: now,
                    cancelReason: reason,
                    delivery: order.delivery
                        ? {
                            update: {
                                status: 'CANCELLED',
                                cancelledAt: now,
                            },
                        }
                        : undefined,
                },
                include: this.orderInclude(),
            });
        });
    }

    async updateOrderStatus(storeId: string, orderId: string, status: any) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        if (order.storeId !== storeId) {
            throw new BadRequestException('Order does not belong to this store');
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
        deliveryStatus: any,
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
        const deliveryUpdateData: any = {
            status: deliveryStatus,
            riderMemo: options.riderMemo?.trim() || undefined,
        };
        const orderUpdateData: any = {
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
            include: this.orderInclude(),
        });

        // DB commit 후 delivery.status_changed 이벤트 발행
        await this.queueService?.publishDeliveryStatusChanged({
            orderId,
            storeId,
            userId: order.userId || undefined,
            previousStatus: previousDeliveryStatus,
            newStatus: deliveryStatus,
        });

        return updatedOrder;
    }

    private orderInclude() {
        return {
            items: {
                include: {
                    selectedOptions: true,
                },
            },
            delivery: true,
            payments: true,
        };
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
