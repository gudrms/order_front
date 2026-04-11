import { Controller, Get, Post, Patch, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('POS Integration')
@Controller('pos')
export class PosController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('orders/pending')
    @ApiOperation({
        summary: '대기 중인 주문 조회 (Polling)',
        description: 'POS에 아직 등록되지 않은(tossOrderId가 없는) PENDING 상태의 주문을 조회합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '주문 목록 조회 성공',
        schema: {
            example: [
                {
                    id: 'order-123',
                    orderNumber: 'ORD-001',
                    totalAmount: 15000,
                    items: [
                        {
                            menuName: 'Taco',
                            menuPrice: 5000,
                            quantity: 3,
                            options: []
                        }
                    ]
                }
            ]
        }
    })
    async getPendingOrders() {
        // 1. PENDING 상태이고, tossOrderId가 없는 주문 조회
        // (또는 tossOrderId가 있어도 PENDING이면 재전송? -> 중복 방지를 위해 tossOrderId가 null인 것만)
        const orders = await this.prisma.order.findMany({
            where: {
                status: 'PENDING',
                tossOrderId: null, // 아직 POS에 등록되지 않은 주문
            },
            include: {
                items: {
                    include: {
                        selectedOptions: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc', // 먼저 들어온 주문부터 처리
            },
        });

        // 메뉴 ID 목록으로 토스 매핑 정보 조회
        const menuIds = [...new Set(orders.flatMap(o => o.items.map(i => i.menuId)))];
        const menus = await this.prisma.menu.findMany({
            where: { id: { in: menuIds } },
            select: {
                id: true,
                tossMenuCode: true,
                category: { select: { id: true, name: true, tossCategoryCode: true } },
            },
        });
        const menuMap = new Map(menus.map(m => [m.id, m]));

        // 옵션의 토스 코드 조회
        const optionNames = orders.flatMap(o =>
            o.items.flatMap(i =>
                i.selectedOptions.map(opt => ({ groupName: opt.optionGroupName, optionName: opt.optionName }))
            )
        );
        const menuOptionMap = new Map<string, string | null>();
        if (optionNames.length > 0) {
            const options = await this.prisma.menuOption.findMany({
                where: {
                    optionGroup: { menu: { id: { in: menuIds } } },
                },
                select: { name: true, tossOptionCode: true },
            });
            for (const opt of options) {
                menuOptionMap.set(opt.name, opt.tossOptionCode);
            }
        }

        // DTO 매핑 (토스 매핑 정보 포함)
        return orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            items: order.items.map(item => {
                const menu = menuMap.get(item.menuId);
                return {
                    menuName: item.menuName,
                    menuPrice: item.menuPrice,
                    quantity: item.quantity,
                    catalogId: menu?.tossMenuCode ?? null,
                    category: menu?.category
                        ? { id: menu.category.tossCategoryCode, name: menu.category.name }
                        : null,
                    options: item.selectedOptions.map(opt => ({
                        name: opt.optionName,
                        price: opt.optionPrice,
                        tossOptionCode: menuOptionMap.get(opt.optionName) ?? null,
                    })),
                };
            }),
        }));
    }

    @Patch('orders/:orderId/status')
    @ApiOperation({
        summary: '주문 상태 및 Toss Order ID 업데이트',
        description: 'POS에 주문 등록 후, 상태를 CONFIRMED로 변경하고 Toss Order ID를 저장합니다.',
    })
    @ApiParam({ name: 'orderId', description: '주문 ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'CONFIRMED' },
                tossOrderId: { type: 'string', example: 'toss-order-123' },
            },
        },
    })
    async updateOrderStatus(
        @Param('orderId') orderId: string,
        @Body() body: { status: string; tossOrderId?: string },
    ) {
        const { status, tossOrderId } = body;

        // 주문 존재 확인
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        // 멱등성: 이미 CONFIRMED 처리된 주문은 그대로 반환
        if (order.status === status && order.tossOrderId) {
            return order;
        }

        // 업데이트
        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: status as any,
                tossOrderId: tossOrderId,
            },
        });
    }

    @Post('catalogs/sync')
    @ApiOperation({
        summary: '토스 POS 카탈로그 동기화',
        description: '플러그인이 SDK로 조회한 카탈로그 데이터를 받아 DB에 동기화합니다.',
    })
    @ApiQuery({ name: 'storeId', description: '매장 ID' })
    async syncCatalogs(
        @Query('storeId') storeId: string,
        @Body() body: { catalogs: TossCatalogDto[] },
    ) {
        const store = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
            throw new NotFoundException(`Store not found: ${storeId}`);
        }

        await this.prisma.$transaction(async (tx) => {
            for (const catalog of body.catalogs) {
                // 카테고리 upsert
                const category = await tx.menuCategory.upsert({
                    where: {
                        storeId_tossCategoryCode: {
                            storeId,
                            tossCategoryCode: String(catalog.category.id),
                        },
                    },
                    update: { name: catalog.category.name },
                    create: {
                        storeId,
                        tossCategoryCode: String(catalog.category.id),
                        name: catalog.category.name,
                    },
                });

                // 메뉴 upsert
                const menu = await tx.menu.upsert({
                    where: {
                        storeId_tossMenuCode: {
                            storeId,
                            tossMenuCode: String(catalog.id),
                        },
                    },
                    update: {
                        categoryId: category.id,
                        name: catalog.title,
                        price: catalog.price.priceValue,
                        soldOut: catalog.state === 'SOLD_OUT',
                        imageUrl: catalog.imageUrl,
                        lastSyncedAt: new Date(),
                    },
                    create: {
                        storeId,
                        categoryId: category.id,
                        tossMenuCode: String(catalog.id),
                        name: catalog.title,
                        price: catalog.price.priceValue,
                        soldOut: catalog.state === 'SOLD_OUT',
                        imageUrl: catalog.imageUrl,
                    },
                });

                // 옵션 동기화
                for (const option of catalog.options) {
                    // 옵션 그룹은 SDK에서 flat하게 올 수 있으므로 기본 그룹 사용
                    let group = await tx.menuOptionGroup.findFirst({
                        where: { menuId: menu.id, name: '옵션' },
                    });
                    if (!group) {
                        group = await tx.menuOptionGroup.create({
                            data: { menuId: menu.id, name: '옵션' },
                        });
                    }

                    const existing = await tx.menuOption.findFirst({
                        where: { optionGroupId: group.id, tossOptionCode: String(option.id) },
                    });

                    if (existing) {
                        await tx.menuOption.update({
                            where: { id: existing.id },
                            data: { name: option.title, price: option.price },
                        });
                    } else {
                        await tx.menuOption.create({
                            data: {
                                optionGroupId: group.id,
                                tossOptionCode: String(option.id),
                                name: option.title,
                                price: option.price,
                            },
                        });
                    }
                }
            }
        });

        return { success: true, synced: body.catalogs.length };
    }
}

interface TossCatalogDto {
    id: number;
    title: string;
    state: string;
    category: { id: number; name: string };
    imageUrl: string | null;
    price: { priceValue: number };
    options: { id: number; title: string; price: number }[];
}
