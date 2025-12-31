export type CallType = 'WATER' | 'TISSUE' | 'CUTLERY' | 'OTHER';
export type CallStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED';
export interface StaffCall {
    id: string;
    tableId: string;
    tableNumber?: number;
    storeId: string;
    type: CallType;
    message: string | null;
    status: CallStatus;
    createdAt: Date | string;
    updatedAt: Date | string;
    completedAt: Date | string | null;
}
export type Call = StaffCall;
export interface CreateCallRequest {
    tableId: string;
    storeId?: string;
    type: CallType;
    message?: string | null;
}
export interface UpdateCallStatusRequest {
    status: CallStatus;
}
