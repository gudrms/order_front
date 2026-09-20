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
                throw new NotFoundException('매장을 찾을 수 없습니다');
            }
            if (!store.isActive) {
                throw new BadRequestException('현재 운영하지 않는 매장입니다');
            }
            if (!store.isDeliveryEnabled) {
                throw new BadRequestException('현재 배달 주문을 받지 않는 매장입니다');
            }
            if (!dto.userId) {
                throw new BadRequestException('배달 주문은 로그인 후 이용할 수 있습니다');
            }
            const paymentMethod = dto.payment.method as string | undefined;
            if (paymentMethod === 'CASH' || dto.payment.paymentKey?.startsWith('CASH_')) {
                throw new BadRequestException('배달 주문은 카드 결제만 이용할 수 있습니다');
            }

            const { totalPrice, orderItemsData } = await prepareOrderItems(tx, storeId, dto.items);

            if (store.minimumOrderAmount && totalPrice < store.minimumOrderAmount) {
                throw new BadRequestException(
                    `최소 주문금액 ${store.minimumOrderAmount.toLocaleString()}원 이상부터 주문할 수 있습니다`,
                );
            }

            const deliveryFee = store.freeDeliveryThreshold && totalPrice >= store.freeDeliveryThreshold
                ? 0
                : store.deliveryFee;
            const expectedAmount = totalPrice + deliveryFee;

            let discountAmount = 0;
            if (dto.userCouponId && !dto.userId) {
                throw new BadRequestException('쿠폰은 로그인 후 사용할 수 있습니다');
            }
            if (dto.userCouponId && dto.userId) {
                // 쿠폰 할인은 배달비를 제외한 상품 금액 기준으로 계산한다.
                // (매장 최소주문금액도 상품 금액만 보므로 기준선을 맞춘다)
                const result = await this.couponsService.validateAndCalculateDiscount(
                    dto.userId,
                    dto.userCouponId,
                    totalPrice,
                );
                discountAmount = result.discountAmount;
            }
            const finalAmount = expectedAmount - discountAmount;

            if (dto.totalAmount !== expectedAmount || dto.payment.amount !== finalAmount) {
                throw new BadRequestException('주문 금액이 현재 메뉴 가격·배달비와 맞지 않습니다. 장바구니를 다시 확인해 주세요');
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
        }, { maxWait: 5000, timeout: 15000 });
    }

    async getDeliveryOrders(params: { storeId?: string; userId?: string; page?: number }) {
        if (!params.userId) {
            throw new BadRequestException('로그인 후 이용할 수 있습니다');
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
            throw new BadRequestException('로그인 후 이용할 수 있습니다');
        }

        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: orderInclude(),
        });

        if (!order) {
            throw new NotFoundException('주문을 찾을 수 없습니다');
        }

        if (order.userId !== lookup.userId) {
            throw new NotFoundException('주문을 찾을 수 없습니다');
        }

        return order;
    }

    async cancelDeliveryOrder(orderId: string, params: { userId?: string; reason?: string }) {
        if (!params.userId) {
            throw new BadRequestException('로그인 후 이용할 수 있습니다');
        }

        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: orderInclude(),
            });

            if (!order || order.type !== 'DELIVERY' || order.userId !== params.userId) {
                throw new NotFoundException('주문을 찾을 수 없습니다');
            }

            if (order.status === 'CANCELLED') {
                return order;
            }

            if (order.paymentStatus === 'PAID') {
                throw new BadRequestException('결제가 완료된 주문입니다. 취소·환불은 매장에 문의해 주세요');
            }

            // 배달 주문은 항상 PENDING_PAYMENT로 생성된다. (PENDING은 테이블 주문 전용)
            if (order.status !== 'PENDING_PAYMENT') {
                throw new BadRequestException('이미 접수된 주문이라 직접 취소할 수 없습니다. 매장에 문의해 주세요');
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
        }, { maxWait: 5000, timeout: 15000 });
    }
}
