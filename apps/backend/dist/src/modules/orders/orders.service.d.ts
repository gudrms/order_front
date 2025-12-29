import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PosService } from '../integrations/pos/pos.service';
export declare class OrdersService {
    private readonly prisma;
    private readonly posService;
    constructor(prisma: PrismaService, posService: PosService);
    createOrder(storeId: string, dto: CreateOrderDto): Promise<{
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
}
