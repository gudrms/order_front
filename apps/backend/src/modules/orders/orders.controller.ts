import { Controller, Post, Body, Param, ValidationPipe, UsePipes, Get, Query, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateDeliveryOrderDto, CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { DeliveryStatusDto, UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

// Prisma Client 생성 전까지 임시로 enum 정의
export enum OrderStatus {
    PENDING = 'PENDING',
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    PAID = 'PAID',
    CONFIRMED = 'CONFIRMED',
    COOKING = 'COOKING',
    PREPARING = 'PREPARING',
    READY = 'READY',
    DELIVERING = 'DELIVERING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

@ApiTags('Orders')
@Controller('stores/:storeId/orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post('first')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: '첫 주문 (세션 시작)',
        description: '세션을 시작하고 첫 주문을 생성합니다. 장바구니에서 처음 주문할 때 사용합니다.',
    })
    @ApiParam({
        name: 'storeId',
        description: '매장 ID',
        example: 'store-1',
    })
    @ApiBody({
        type: CreateOrderDto,
        description: '주문 생성 데이터',
        examples: {
            example1: {
                summary: '첫 주문 예시',
                value: {
                    tableNumber: 5,
                    items: [
                        {
                            menuId: 'menu-chicken-1-fried',
                            quantity: 2,
                            options: [
                                { optionId: 'opt-item-1-1p' },
                            ],
                        },
                        {
                            menuId: 'menu-drink-1-cola',
                            quantity: 2,
                        },
                    ],
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: '첫 주문 성공 (세션 시작)',
        schema: {
            example: {
                success: true,
                data: {
                    session: {
                        id: 'session-123',
                        sessionNumber: 'SES-20241231-001',
                        tableNumber: 5,
                        status: 'ACTIVE',
                    },
                    order: {
                        id: 'order-456',
                        orderNumber: 'ORD-20241231-001',
                        totalAmount: 40000,
                        items: [],
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: '잘못된 요청 (유효성 검증 실패)' })
    @ApiResponse({ status: 404, description: '매장 또는 메뉴를 찾을 수 없습니다.' })
    async createFirstOrder(
        @Param('storeId') storeId: string,
        @Body() createOrderDto: CreateOrderDto,
    ) {
        return this.ordersService.createFirstOrder(storeId, createOrderDto.tableNumber, createOrderDto);
    }

    @Post(':sessionId')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: '추가 주문 (기존 세션)',
        description: '기존 세션에 추가 주문을 생성합니다.',
    })
    @ApiParam({
        name: 'storeId',
        description: '매장 ID',
        example: 'store-1',
    })
    @ApiParam({
        name: 'sessionId',
        description: '세션 ID',
        example: 'session-123',
    })
    @ApiBody({
        type: CreateOrderDto,
        description: '주문 생성 데이터',
    })
    @ApiResponse({
        status: 201,
        description: '추가 주문 성공',
    })
    @ApiResponse({ status: 404, description: '세션 또는 메뉴를 찾을 수 없습니다.' })
    async createAdditionalOrder(
        @Param('storeId') storeId: string,
        @Param('sessionId') sessionId: string,
        @Body() createOrderDto: CreateOrderDto,
    ) {
        return this.ordersService.createOrder(storeId, sessionId, createOrderDto);
    }

    @Get()
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '주문 목록 조회 (인증 필요)',
        description: '특정 매장의 주문 목록을 조회합니다. 상태별 필터링과 페이지네이션을 지원합니다.',
    })
    @ApiParam({
        name: 'storeId',
        description: '매장 ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: OrderStatus,
        description: '주문 상태 필터 (선택사항)',
        example: 'PENDING',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: '페이지 번호 (기본값: 1)',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: '주문 목록 조회 성공',
        schema: {
            example: {
                success: true,
                data: [
                    {
                        id: 'order-123',
                        orderNumber: 'ORD-20240101-001',
                        tableNumber: 5,
                        status: 'PENDING',
                        totalAmount: 36000,
                        createdAt: '2024-01-01T12:00:00Z',
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 50,
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 404, description: '매장을 찾을 수 없습니다.' })
    async getOrders(
        @Param('storeId') storeId: string,
        @Query('status') status?: OrderStatus,
        @Query('page') page: number = 1,
    ) {
        return this.ordersService.getOrders(storeId, status, page);
    }

    @Get('pos-sync/failed')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'POS 전송 실패 주문 목록',
        description: '관리자 화면에서 POS 전송 실패 주문과 마지막 오류를 확인하기 위한 목록입니다.',
    })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
    async getPosSyncFailures(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Query('page') page: number = 1,
    ) {
        return this.ordersService.getPosSyncFailures(storeId, Number(page) || 1, user.id);
    }

    @Patch(':orderId/pos-sync/retry')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'POS 전송 수동 재시도',
        description: '관리자가 실패한 POS 전송을 다시 대기 상태로 전환하고 pos.send_order 큐 작업을 재발행합니다.',
    })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'orderId', description: '주문 ID' })
    @ApiResponse({ status: 200, description: 'POS 전송 재시도 등록 성공' })
    @ApiResponse({ status: 400, description: '재시도할 수 없는 주문 상태' })
    @ApiResponse({ status: 404, description: '주문을 찾을 수 없음' })
    async retryPosSync(
        @CurrentUser() user: { id: string },
        @Param('storeId') storeId: string,
        @Param('orderId') orderId: string,
    ) {
        return this.ordersService.retryPosSync(storeId, orderId, user.id);
    }

    @Patch(':orderId/status')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '주문 상태 변경 (인증 필요)',
        description: '주문의 상태를 변경합니다. (PENDING → CONFIRMED → COOKING → COMPLETED)',
    })
    @ApiParam({
        name: 'storeId',
        description: '매장 ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiParam({
        name: 'orderId',
        description: '주문 ID (UUID)',
        example: 'order-123',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['PENDING', 'CONFIRMED', 'COOKING', 'COMPLETED', 'CANCELLED'],
                    description: '변경할 주문 상태',
                    example: 'CONFIRMED',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: '주문 상태 변경 성공',
        schema: {
            example: {
                success: true,
                data: {
                    id: 'order-123',
                    status: 'CONFIRMED',
                    updatedAt: '2024-01-01T12:05:00Z',
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 404, description: '주문을 찾을 수 없습니다.' })
    async updateOrderStatus(
        @Param('storeId') storeId: string,
        @Param('orderId') orderId: string,
        @Body('status') status: OrderStatus,
    ) {
        return this.ordersService.updateOrderStatus(storeId, orderId, status);
    }

    @Patch(':orderId/delivery-status')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({
        summary: '배달 상태 변경',
        description: '매장/관리자에서 배달 주문의 배송 상태를 변경합니다. 배송 시작/완료/취소 상태는 고객앱 주문 상태에도 함께 반영됩니다.',
    })
    @ApiParam({ name: 'storeId', description: '매장 ID' })
    @ApiParam({ name: 'orderId', description: '주문 ID' })
    @ApiBody({ type: UpdateDeliveryStatusDto })
    @ApiResponse({ status: 200, description: '배달 상태 변경 성공' })
    @ApiResponse({ status: 400, description: '배달 주문이 아니거나 변경할 수 없는 상태' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 404, description: '주문을 찾을 수 없습니다.' })
    async updateDeliveryStatus(
        @Param('storeId') storeId: string,
        @Param('orderId') orderId: string,
        @Body() dto: UpdateDeliveryStatusDto,
    ) {
        return this.ordersService.updateDeliveryStatus(storeId, orderId, dto.status as DeliveryStatusDto, {
            riderMemo: dto.riderMemo,
        });
    }
}

@ApiTags('Orders')
@Controller('orders')
export class RootOrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get()
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '배달 주문 목록 조회',
        description: '배달앱 주문내역에서 로그인 사용자의 주문 목록을 조회합니다.',
    })
    @ApiQuery({ name: 'storeId', required: false, description: '매장 ID' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
    async getDeliveryOrders(
        @Query('storeId') storeId?: string,
        @Query('page') page: number = 1,
        @CurrentUser() user?: { id: string },
    ) {
        return this.ordersService.getDeliveryOrders({
            storeId,
            userId: user?.id,
            page: Number(page) || 1,
        });
    }

    @Get(':orderId')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: '주문 상세 조회',
        description: '배달앱 주문상세에서 로그인 사용자의 주문 상세 정보를 조회합니다.',
    })
    @ApiParam({ name: 'orderId', description: '주문 ID' })
    async getOrderById(
        @Param('orderId') orderId: string,
        @CurrentUser() user?: { id: string },
    ) {
        return this.ordersService.getOrderById(orderId, { userId: user?.id });
    }

    @Patch(':orderId/cancel')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({
        summary: '배달 주문 고객 취소',
        description: '로그인 사용자가 본인 배달 주문을 결제 승인 전 상태에서 직접 취소합니다. 결제 완료 주문은 관리자 환불 승인 흐름에서 처리합니다.',
    })
    @ApiParam({ name: 'orderId', description: '주문 ID' })
    @ApiBody({ type: CancelOrderDto })
    @ApiResponse({ status: 200, description: '주문 취소 성공' })
    @ApiResponse({ status: 400, description: '이미 결제 완료되었거나 고객 취소가 불가능한 상태' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 404, description: '주문을 찾을 수 없거나 본인 주문이 아님' })
    async cancelDeliveryOrder(
        @Param('orderId') orderId: string,
        @Body() dto: CancelOrderDto,
        @CurrentUser() user?: { id: string },
    ) {
        return this.ordersService.cancelDeliveryOrder(orderId, {
            userId: user?.id,
            reason: dto.reason,
        });
    }

    @Post('homepage')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: '홈페이지 직접 주문 생성',
        description: '브랜드 홈페이지에서 비회원 배송 주문을 생성합니다. 결제 승인은 Toss success redirect 이후 공통 결제 승인 API에서 처리합니다.',
    })
    @ApiBody({
        type: CreateDeliveryOrderDto,
    })
    @ApiResponse({
        status: 201,
        description: '홈페이지 주문 생성 성공',
    })
    async createHomepageOrder(
        @Body() createOrderDto: CreateDeliveryOrderDto,
    ) {
        return this.ordersService.createDeliveryOrder(createOrderDto.storeId, {
            ...createOrderDto,
            source: 'HOMEPAGE',
            userId: undefined,
        });
    }

    @Post()
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: '배달/포장 주문 생성',
        description: '배달앱, 홈페이지, 토스 SDK 앱에서 공통으로 사용할 주문 생성 엔드포인트입니다.',
    })
    @ApiBody({
        type: CreateDeliveryOrderDto,
    })
    @ApiResponse({
        status: 201,
        description: '주문 생성 성공',
    })
    async createOrder(
        @Body() createOrderDto: CreateDeliveryOrderDto,
        @CurrentUser() user?: { id: string },
    ) {
        return this.ordersService.createDeliveryOrder(createOrderDto.storeId, {
            ...createOrderDto,
            userId: user?.id,
        });
    }
}
