import { Controller, Post, Body, Param, ValidationPipe, UsePipes, Get, Query, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SupabaseGuard } from '../auth/guards/supabase.guard';

// Prisma Client 생성 전까지 임시로 enum 정의
export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    COOKING = 'COOKING',
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
}
