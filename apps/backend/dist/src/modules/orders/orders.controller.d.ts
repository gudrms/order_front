import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(storeId: string, createOrderDto: CreateOrderDto): Promise<{
        id: string;
        orderNumber: string;
        tableNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        note: string | null;
        okposOrderId: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
    }>;
    getOrders(storeId: string, status?: OrderStatus, page?: number): Promise<any>;
    updateOrderStatus(storeId: string, orderId: string, status: OrderStatus): Promise<any>;
}
