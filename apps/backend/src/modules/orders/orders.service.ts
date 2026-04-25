import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryOrderDto, CreateOrderDto } from './dto/create-order.dto';
import { ResilientPosService } from '../integrations/pos/pos.resilience';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly posService: ResilientPosService,
        private readonly sessionsService: SessionsService,
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

            const { totalPrice, orderItemsData } = await this.prepareOrderItems(tx, storeId, dto.items);
            if (totalPrice < store.minimumOrderAmount) {
                throw new BadRequestException(`Minimum order amount is ${store.minimumOrderAmount}`);
            }

            const deliveryFee = store.freeDeliveryThreshold && totalPrice >= store.freeDeliveryThreshold
                ? 0
                : store.deliveryFee;
            const expectedAmount = totalPrice + deliveryFee;

            if (dto.totalAmount !== expectedAmount || dto.payment.amount !== expectedAmount) {
                throw new BadRequestException('Order amount does not match current menu and delivery fee');
            }

            const isCashPayment = dto.payment.method === 'CASH' || dto.payment.paymentKey?.startsWith('CASH_');
            const paymentStatus = isCashPayment ? 'PENDING' : 'READY';

            return tx.order.create({
                data: {
                    storeId,
                    userId: dto.userId,
                    orderNumber: await this.generateOrderNumber(tx, storeId),
                    type: 'DELIVERY',
                    source: 'DELIVERY_APP',
                    status: isCashPayment ? 'PENDING' : 'PENDING_PAYMENT',
                    paymentStatus,
                    totalAmount: expectedAmount,
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
                            provider: isCashPayment ? 'CASH' : 'TOSS_PAYMENTS',
                            method: isCashPayment ? 'CASH' : 'TOSS',
                            status: paymentStatus,
                            amount: expectedAmount,
                            paymentKey: dto.payment.paymentKey,
                            providerOrderId: dto.payment.orderId,
                            idempotencyKey: dto.payment.orderId,
                            rawPayload: dto.payment as any,
                        },
                    },
                },
                include: this.orderInclude(),
            });
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
}
