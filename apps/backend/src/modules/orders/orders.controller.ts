import { Controller, Post, Body, Param, ValidationPipe, UsePipes, Get, Query, Patch, UseGuards } from '@nestjs/common';
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

@Controller('stores/:storeId/orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    async createOrder(
        @Param('storeId') storeId: string,
        @Body() createOrderDto: CreateOrderDto,
    ) {
        return this.ordersService.createOrder(storeId, createOrderDto);
    }

    @Get()
    @UseGuards(SupabaseGuard)
    async getOrders(
        @Param('storeId') storeId: string,
        @Query('status') status?: OrderStatus,
        @Query('page') page: number = 1,
    ) {
        return this.ordersService.getOrders(storeId, status, page);
    }

    @Patch(':orderId/status')
    @UseGuards(SupabaseGuard)
    async updateOrderStatus(
        @Param('storeId') storeId: string,
        @Param('orderId') orderId: string,
        @Body('status') status: OrderStatus,
    ) {
        return this.ordersService.updateOrderStatus(storeId, orderId, status);
    }
}
