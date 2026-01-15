import { Controller, Get, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
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

        // DTO 매핑 (필요한 정보만 전달)
        return orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            items: order.items.map(item => ({
                menuName: item.menuName,
                menuPrice: item.menuPrice,
                quantity: item.quantity,
                options: item.selectedOptions.map(opt => ({
                    name: opt.optionName,
                    price: opt.optionPrice,
                })),
            })),
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

        // 업데이트
        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: status as any, // Enum 타입 캐스팅 필요할 수 있음
                tossOrderId: tossOrderId,
            },
        });
    }
}
