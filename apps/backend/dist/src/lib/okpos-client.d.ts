interface OkposOrder {
    orderNumber: string;
    tableNumber: number;
    items: Array<{
        menuName: string;
        quantity: number;
        price: number;
        options?: string;
    }>;
    totalAmount: number;
}
export declare function sendOrderToOkpos(order: OkposOrder, retries?: number): Promise<{
    success: boolean;
    okposOrderId?: string;
    error?: string;
}>;
export declare function sendOrderToOkposBackground(order: OkposOrder): void;
export {};
