import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ResilientPosService } from '../integrations/pos/pos.resilience';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly posService: ResilientPosService,
        private readonly sessionsService: SessionsService,
    ) { }

    /**
     * 첫 주문 (세션 시작)
     */
    async createFirstOrder(storeId: string, tableNumber: number, dto: CreateOrderDto) {
        // 1. 세션 시작
        const session = await this.sessionsService.startSession(storeId, tableNumber);

        // 2. 주문 생성
        const order = await this.createOrder(storeId, session.id, dto);

        return {
            session,
            order,
        };
    }

    /**
     * 주문 생성 (기존 세션)
     */
    async createOrder(storeId: string, sessionId: string, dto: CreateOrderDto) {
        // 세션 존재 확인
        const session = await this.sessionsService.getSessionById(sessionId);

        // 트랜잭션 시작
        const order = await this.prisma.$transaction(async (tx) => {
            // 1. 메뉴 및 옵션 정보 조회 (가격 검증용)
            const menuIds = dto.items.map((item) => item.menuId);
            const menus = await tx.menu.findMany({
                where: { id: { in: menuIds }, storeId },
                include: { optionGroups: { include: { options: true } } },
            });

            // 2. 주문 총액 계산 및 데이터 검증
            let totalPrice = 0;
            const orderItemsData = [];

            for (const itemDto of dto.items) {
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
                        // 옵션 찾기 (모든 그룹 순회)
                        const option = menu.optionGroups
                            .flatMap((g) => g.options)
                            .find((o) => o.id === optDto.optionId);

                        if (!option) {
                            throw new NotFoundException(`Option not found: ${optDto.optionId}`);
                        }
                        if (option.isSoldOut) {
                            throw new BadRequestException(`Option is sold out: ${option.name}`);
                        }

                        itemPrice += option.price;

                        // 옵션 스냅샷 데이터 준비
                        const optionGroup = menu.optionGroups.find((g) => g.id === option.optionGroupId);
                        itemOptionsData.push({
                            menuOptionId: option.id,
                            optionGroupName: optionGroup?.name || 'Unknown',
                            optionName: option.name,
                            optionPrice: option.price,
                        });
                    }
                }

                totalPrice += itemPrice * itemDto.quantity;

                // 주문 상세 스냅샷 데이터 준비
                orderItemsData.push({
                    menuId: menu.id,
                    menuName: menu.name,
                    menuPrice: menu.price,
                    quantity: itemDto.quantity,
                    totalPrice: itemPrice * itemDto.quantity,
                    selectedOptions: {
                        create: itemOptionsData.map((opt) => ({
                            optionGroupName: opt.optionGroupName,
                            optionName: opt.optionName,
                            optionPrice: opt.optionPrice,
                        })),
                    },
                });
            }

            // 3. 주문 생성 (Order)
            return tx.order.create({
                data: {
                    storeId,
                    sessionId,
                    tableNumber: session.tableNumber,
                    orderNumber: await this.generateOrderNumber(storeId),
                    status: 'PENDING',
                    totalAmount: totalPrice,
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
                include: {
                    items: {
                        include: {
                            selectedOptions: true,
                        },
                    },
                },
            });
        });

        // 세션 총액 업데이트
        await this.sessionsService.updateSessionTotal(sessionId, order.totalAmount);

        // 4. POS 전송 (Mock) - 트랜잭션 완료 후 실행
        try {
            await this.posService.sendOrder(order);
        } catch (error) {
            console.error('Failed to send order to POS:', error);
            // POS 전송 실패가 주문 생성을 취소시키지는 않음
        }

        return order;
    }

    private async generateOrderNumber(storeId: string): Promise<string> {
        // 간단한 주문 번호 생성 (실제로는 Redis나 DB 시퀀스 사용 권장)
        const count = await this.prisma.order.count({
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
                include: {
                    items: {
                        include: {
                            selectedOptions: true,
                        },
                    },
                },
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
            data: { status },
        });
    }
}
