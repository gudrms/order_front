import { Controller, Get, Post, Patch, Param, Body, Query, Headers, ConflictException, Logger, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { PosIntegrationGuard } from './pos-integration.guard';

@ApiTags('POS Integration')
@ApiHeader({ name: 'x-pos-api-key', description: 'POS 플러그인 연동 API 키' })
@UseGuards(PosIntegrationGuard)
@Controller('pos')
export class PosController {
    private readonly logger = new Logger(PosController.name);
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
        // 결제 정책: 배달은 토스페이먼츠 카드 결제만 받음 → status=PAID 가 POS 전송 트리거.
        // tossOrderId IS NULL 로 중복 전송 방지.
        const orders = await this.prisma.order.findMany({
            where: {
                status: 'PAID',
                tossOrderId: null,
                posSyncStatus: { in: ['PENDING', 'FAILED'] },
            },
            include: {
                items: {
                    include: {
                        selectedOptions: true,
                    },
                },
                payments: {
                    where: { status: 'PAID' },
                    orderBy: { approvedAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

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

        // 옵션 매핑 키는 (menuId, optionGroupName, optionName) 3종 복합.
        // 옵션명만으로 매핑하면 다른 메뉴에 같은 옵션명("기본", "보통" 등)이 있을 때 마지막 메뉴의
        // tossOptionCode로 덮어써져서 잘못된 옵션이 POS에 전송됨 (실데이터 오염 버그).
        const hasAnyOptions = orders.some(o => o.items.some(i => i.selectedOptions.length > 0));
        const menuOptionMap = new Map<string, string | null>();
        if (hasAnyOptions) {
            const options = await this.prisma.menuOption.findMany({
                where: {
                    optionGroup: { menu: { id: { in: menuIds } } },
                },
                select: {
                    name: true,
                    tossOptionCode: true,
                    optionGroup: {
                        select: { name: true, menuId: true },
                    },
                },
            });
            for (const opt of options) {
                const key = `${opt.optionGroup.menuId}::${opt.optionGroup.name}::${opt.name}`;
                menuOptionMap.set(key, opt.tossOptionCode);
            }
        }

        return orders.map(order => {
            const payment = order.payments[0];
            const paymentDto = payment ? this.toPosPaymentDto(payment) : null;
            return {
                id: order.id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                note: order.note ?? null,
                posSyncStatus: order.posSyncStatus,
                posSyncAttemptCount: order.posSyncAttemptCount,
                posSyncLastError: order.posSyncLastError,
                payment: paymentDto,
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
                        options: item.selectedOptions.map(opt => {
                            const key = `${item.menuId}::${opt.optionGroupName}::${opt.optionName}`;
                            return {
                                name: opt.optionName,
                                price: opt.optionPrice,
                                tossOptionCode: menuOptionMap.get(key) ?? null,
                            };
                        }),
                    };
                }),
            };
        });
    }

    private toPosPaymentDto(payment: any) {
        // 토스 PluginPaymentDto(EXTERNAL) 매핑.
        // raw payload 우선, 없으면 한국 부가가치세 10% 기준 분할.
        const raw = (payment.rawPayload ?? {}) as Record<string, any>;
        const amount = payment.approvedAmount ?? payment.amount;
        const supplyMoney = typeof raw.suppliedAmount === 'number'
            ? raw.suppliedAmount
            : Math.round(amount / 1.1);
        const taxMoney = typeof raw.vat === 'number' ? raw.vat : amount - supplyMoney;
        const approvedAt = (payment.approvedAt instanceof Date)
            ? payment.approvedAt.toISOString()
            : (payment.approvedAt ?? new Date().toISOString());
        return {
            paymentKey: payment.paymentKey ?? '',
            approvedNo: raw.approveNo ?? raw.approvalNumber ?? payment.paymentKey ?? '',
            approvedAt,
            amountMoney: amount,
            supplyMoney,
            taxMoney,
            tipMoney: 0,
            taxExemptMoney: typeof raw.taxFreeAmount === 'number' ? raw.taxFreeAmount : 0,
        };
    }

    @Get('orders/by-toss-id/:tossOrderId')
    @ApiOperation({
        summary: 'Toss Order ID로 백엔드 주문 조회 (취소 동기화용)',
        description: '플러그인이 payment.on(cancel) 이벤트로 받은 tossOrderId를 백엔드 주문 ID로 변환합니다.',
    })
    @ApiParam({ name: 'tossOrderId', description: 'Toss POS Order ID' })
    async getOrderByTossId(@Param('tossOrderId') tossOrderId: string) {
        const order = await this.prisma.order.findFirst({
            where: { tossOrderId },
            select: { id: true, status: true },
        });
        if (!order) {
            throw new NotFoundException(`Order not found for tossOrderId: ${tossOrderId}`);
        }
        return order;
    }

    @Patch('orders/:orderId/status')
    @ApiOperation({
        summary: '주문 상태 및 Toss Order ID 업데이트',
        description: 'POS에 주문 등록 후, 상태를 CONFIRMED로 변경하고 Toss Order ID를 저장합니다. Idempotency-Key 헤더로 재시도 안전.',
    })
    @ApiParam({ name: 'orderId', description: '주문 ID' })
    @ApiHeader({
        name: 'Idempotency-Key',
        description: '재시도/중복 요청 식별자. 동일 키로 재요청 시 idempotent 처리. 권장 형식: order-{orderId}-{status}',
        required: false,
    })
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
        @Headers('idempotency-key') idempotencyKey?: string,
    ) {
        const { status, tossOrderId } = body;

        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        if (idempotencyKey) {
            this.logger.log(`PATCH /pos/orders/${orderId}/status idempotencyKey=${idempotencyKey} status=${status} tossOrderId=${tossOrderId ?? '(none)'}`);
        }

        // 멱등성 1: 동일 status + 동일 tossOrderId(또는 둘 다 비어있음) → 기존 결과 반환
        const sameTossId = (order.tossOrderId ?? null) === (tossOrderId ?? null);
        if (order.status === status && sameTossId) {
            return order;
        }

        // 충돌 가드: 이미 다른 tossOrderId로 연결돼 있으면 덮어쓰기 거부 (플러그인 재시작 시 중복 등록 방지).
        // 단 CANCELLED 전이는 같은 tossOrderId일 때만 허용 (위 sameTossId 체크 통과 시 진입).
        if (order.tossOrderId && tossOrderId && order.tossOrderId !== tossOrderId) {
            throw new ConflictException(
                `Order ${orderId} already linked to tossOrderId=${order.tossOrderId}, refused to overwrite with ${tossOrderId}`,
            );
        }

        const data: any = {
            status: status as any,
            tossOrderId: tossOrderId ?? order.tossOrderId,
        };

        if (status === 'CONFIRMED' && (tossOrderId || order.tossOrderId)) {
            data.posSyncStatus = 'SENT';
            data.posSyncLastError = null;
            data.posSyncUpdatedAt = new Date();
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data,
        });
    }

    @Patch('orders/:orderId/sync-failed')
    @ApiOperation({
        summary: 'POS 주문 등록 실패 기록',
        description: 'POS 플러그인이 주문 등록 실패를 백엔드에 기록합니다. 실패 주문은 pending polling 대상에 남아 재시도됩니다.',
    })
    @ApiParam({ name: 'orderId', description: '주문 ID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'POS network timeout' },
            },
        },
    })
    async markOrderSyncFailed(
        @Param('orderId') orderId: string,
        @Body() body: { message?: string },
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        if (order.tossOrderId || order.posSyncStatus === 'SENT') {
            return order;
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                posSyncStatus: 'FAILED',
                posSyncAttemptCount: { increment: 1 },
                posSyncLastError: body.message?.trim() || 'POS sync failed',
                posSyncUpdatedAt: new Date(),
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
                // SDK 카탈로그 state: ON_SALE | SOLD_OUT | UNAVAILABLE | DELETED
                //   - SOLD_OUT       → 일시 품절 (soldOut=true, isActive 유지)
                //   - UNAVAILABLE    → 기타 판매불가 (isHidden=true, soldOut=true)
                //   - DELETED        → 제거됨 (isActive=false, 논리삭제)
                //   - ON_SALE        → 정상 판매중
                const isSoldOut = catalog.state === 'SOLD_OUT' || catalog.state === 'UNAVAILABLE';
                const isHidden = catalog.state === 'UNAVAILABLE';
                const isActive = catalog.state !== 'DELETED';

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
                        soldOut: isSoldOut,
                        isHidden,
                        isActive,
                        imageUrl: catalog.imageUrl,
                        lastSyncedAt: new Date(),
                    },
                    create: {
                        storeId,
                        categoryId: category.id,
                        tossMenuCode: String(catalog.id),
                        name: catalog.title,
                        price: catalog.price.priceValue,
                        soldOut: isSoldOut,
                        isHidden,
                        isActive,
                        imageUrl: catalog.imageUrl,
                    },
                });

                // 옵션 그룹 단위 동기화 (SDK PluginCatalogItemOption은 그룹).
                // (menuId, name)을 자연키로 사용 — 그룹 rename 시 별도 그룹으로 인식됨에 유의.
                // SDK maxChoices === -1 = 무제한 → 999로 저장 (Int 컬럼 호환).
                const optionGroups = catalog.optionGroups ?? [];
                for (const group of optionGroups) {
                    const groupName = group.title || '옵션';
                    const minSelect = Math.max(0, group.minChoices ?? (group.isRequired ? 1 : 0));
                    const maxSelect = group.maxChoices === -1 ? 999 : Math.max(1, group.maxChoices ?? 1);

                    let dbGroup = await tx.menuOptionGroup.findFirst({
                        where: { menuId: menu.id, name: groupName },
                    });
                    if (dbGroup) {
                        dbGroup = await tx.menuOptionGroup.update({
                            where: { id: dbGroup.id },
                            data: { minSelect, maxSelect },
                        });
                    } else {
                        dbGroup = await tx.menuOptionGroup.create({
                            data: { menuId: menu.id, name: groupName, minSelect, maxSelect },
                        });
                    }

                    for (const choice of group.choices) {
                        const isSoldOut = choice.state === 'SOLD_OUT';
                        const existing = await tx.menuOption.findFirst({
                            where: { optionGroupId: dbGroup.id, tossOptionCode: String(choice.id) },
                        });

                        if (existing) {
                            await tx.menuOption.update({
                                where: { id: existing.id },
                                data: { name: choice.title, price: choice.priceValue, isSoldOut },
                            });
                        } else {
                            await tx.menuOption.create({
                                data: {
                                    optionGroupId: dbGroup.id,
                                    tossOptionCode: String(choice.id),
                                    name: choice.title,
                                    price: choice.priceValue,
                                    isSoldOut,
                                },
                            });
                        }
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
    optionGroups?: TossCatalogOptionGroupDto[];
}

interface TossCatalogOptionGroupDto {
    id: number;
    title: string;
    isRequired: boolean;
    minChoices: number;
    maxChoices: number;
    choices: TossCatalogOptionChoiceDto[];
}

interface TossCatalogOptionChoiceDto {
    id: number;
    title: string;
    priceValue: number;
    state?: 'ON_SALE' | 'SOLD_OUT';
}
