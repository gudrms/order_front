import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PosService } from '../integrations/pos/pos.service';
export declare class OrdersService {
    private readonly prisma;
    private readonly posService;
    constructor(prisma: PrismaService, posService: PosService);
    createOrder(storeId: string, dto: CreateOrderDto): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        orderNumber: string;
        tableNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        note: string | null;
        okposOrderId: string | null;
    }>;
    private generateOrderNumber;
    getOrders(storeId: string, status?: any, page?: number): Promise<{
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
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            orderNumber: string;
            tableNumber: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            totalAmount: number;
            note: string | null;
            okposOrderId: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            lastPage: number;
        };
    }>;
    updateOrderStatus(storeId: string, orderId: string, status: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        orderNumber: string;
        tableNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        note: string | null;
        okposOrderId: string | null;
    }>;
}
