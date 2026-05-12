import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryOrderDto } from './dto/create-order.dto';
import { CouponsService } from '../coupons/coupons.service';
import { orderInclude, prepareOrderItems, generateOrderNumber } from './order-helpers';

@Injectable()
export class DeliveryOrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly couponsService: CouponsService,
    ) { }

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

            const { totalPrice, orderItemsData } = await prepareOrderItems(tx, storeId, dto.items);

            if (store.minimumOrderAmount && totalPrice < store.minimumOrderAmount) {
                throw new BadRequestException(
                    `Order amount is below the store minimum of ${store.minimumOrderAmount}`,
                );
            }

            const deliveryFee = store.freeDeliveryThreshold && totalPrice >= store.freeDeliveryThreshold
                ? 0
                : store.deliveryFee;
            const expectedAmount = totalPrice + deliveryFee;

            let discountAmount = 0;
            if (dto.userCouponId && !dto.userId) {
                throw new BadRequestException('Coupons require an authenticated user');
            }
            if (dto.userCouponId && dto.userId) {
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
                    orderNumber: await generateOrderNumber(tx, storeId),
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
                            rawPayload: dto.payment as unknown as Prisma.InputJsonValue,
                        },
                    },
                },
                include: orderInclude(),
            });

            if (dto.userCouponId) {
                await this.couponsService.markAsUsed(tx, dto.userCouponId, order.id);
            }

            return order;
        });
    }

    async getDeliveryOrders(params: { storeId?: string; userId?: string; page?: number }) {
        if (!params.userId) {
            throw new BadRequestException('userId is required to lookup delivery orders');
        }

        const take = 20;
        const page = params.page || 1;
        const skip = (page - 1) * take;
        const where: Prisma.OrderWhereInput = {
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

    async getOrderById(orderId: string, lookup?: { userId?: string }) {
        if (!lookup?.userId) {
            throw new BadRequestException('userId is required to lookup a delivery order');
        }

        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: orderInclude(),
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
                include: orderInclude(),
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
                include: orderInclude(),
            });
        });
    }
}
