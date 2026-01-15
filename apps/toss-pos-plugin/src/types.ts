export interface BackendOrder {
    id: string;
    orderNumber: string;
    totalAmount: number;
    items: BackendOrderItem[];
    status: string;
    tossOrderId?: string;
}

export interface BackendOrderItem {
    menuName: string;
    menuPrice: number;
    quantity: number;
    options?: BackendOrderOption[];
}

export interface BackendOrderOption {
    name: string;
    price: number;
}

// Toss Place Plugin SDK Types (Approximate based on usage)
export interface PluginOrderDto {
    orderNumber: string;
    totalAmount: number;
    items: PluginOrderItemDto[];
    // Add other fields as required by SDK documentation
}

export interface PluginOrderItemDto {
    name: string;
    price: number;
    quantity: number;
    options?: PluginOrderOptionDto[];
}

export interface PluginOrderOptionDto {
    name: string;
    price: number;
}
