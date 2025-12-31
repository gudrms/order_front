export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'COOKING' | 'COMPLETED' | 'CANCELLED';
export interface SelectedOptionItem {
    optionItemId: string;
    name: string;
    price: number;
}
export interface SelectedOption {
    optionGroupId: string;
    optionGroupName: string;
    items: SelectedOptionItem[];
}
export interface CartSelectedOption {
    id: string;
    groupName: string;
    itemId: string;
    itemName: string;
    price: number;
}
export interface OrderItem {
    id: string;
    orderId: string;
    menuId: string;
    menuName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    options?: SelectedOption[];
    createdAt: Date | string;
    updatedAt: Date | string;
}
export interface Order {
    id: string;
    orderNumber: string;
    tableId: string;
    tableNumber?: number;
    storeId: string;
    items: OrderItem[];
    totalPrice: number;
    status: OrderStatus;
    okposOrderId: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    completedAt: Date | string | null;
}
export interface CreateOrderRequest {
    tableId: string;
    storeId: string;
    items: {
        menuId: string;
        quantity: number;
        options?: {
            optionGroupId: string;
            optionItemIds: string[];
        }[];
    }[];
}
export interface UpdateOrderStatusRequest {
    status: OrderStatus;
}
export interface OrderListResponse {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
}
