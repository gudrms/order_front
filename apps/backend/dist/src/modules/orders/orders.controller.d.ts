import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(storeId: string, createOrderDto: CreateOrderDto): Promise<{
        items: ({
            selectedOptions: {
                id: string;
                createdAt: Date;
                optionGroupName: string;
                optionName: string;
                optionPrice: number;
                orderItemId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            menuId: string;
            menuName: string;
            menuPrice: number;
            quantity: number;
            totalPrice: number;
            orderId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        orderNumber: string;
        tableNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        note: string | null;
        okposOrderId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getOrders(storeId: string, status?: OrderStatus, page?: number): Promise<{
        data: ({
            items: ({
                selectedOptions: {
                    id: string;
                    createdAt: Date;
                    optionGroupName: string;
                    optionName: string;
                    optionPrice: number;
                    orderItemId: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                menuId: string;
                menuName: string;
                menuPrice: number;
                quantity: number;
                totalPrice: number;
                orderId: string;
            })[];
        } & {
            id: string;
            storeId: string;
            orderNumber: string;
            tableNumber: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            totalAmount: number;
            note: string | null;
            okposOrderId: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    updateOrderStatus(storeId: string, orderId: string, status: OrderStatus): Promise<{
        id: string;
        storeId: string;
        orderNumber: string;
        tableNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        note: string | null;
        okposOrderId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
