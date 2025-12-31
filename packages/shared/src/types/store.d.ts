export type StoreType = 'MEXICAN' | 'PUB' | 'JAPANESE' | 'KOREAN' | 'CHINESE' | 'WESTERN' | 'CAFE' | 'GENERAL';
export interface Store {
    id: string;
    storeType: string;
    branchId: string;
    name: string;
    branchName: string;
    type: StoreType;
    okposBranchCode: string | null;
    description: string | null;
    address: string | null;
    phoneNumber: string | null;
    businessHours: Record<string, any> | null;
    theme: Record<string, any> | null;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}
export interface CreateStoreRequest {
    storeType: string;
    branchId: string;
    name: string;
    branchName: string;
    type: StoreType;
    description?: string;
    address?: string;
    phoneNumber?: string;
}
