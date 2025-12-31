export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
export interface Table {
    id: string;
    number: number;
    capacity: number;
    status: TableStatus;
    storeId: string;
    currentOrderId: string | null;
    qrCodeUrl: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}
export interface UpdateTableStatusRequest {
    status: TableStatus;
}
export interface CreateTableRequest {
    number: number;
    capacity: number;
    storeId: string;
}
