export declare class PosService {
    private readonly logger;
    sendOrderToPos(order: any): Promise<{
        success: boolean;
        posOrderId: string;
    }>;
}
