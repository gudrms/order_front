export declare class CreateOrderItemOptionDto {
    optionId: string;
}
export declare class CreateOrderItemDto {
    menuId: string;
    quantity: number;
    options?: CreateOrderItemOptionDto[];
}
export declare class CreateOrderDto {
    tableId?: string;
    items: CreateOrderItemDto[];
}
