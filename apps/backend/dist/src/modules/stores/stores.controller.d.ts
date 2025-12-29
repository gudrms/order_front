import { StoresService } from './stores.service';
export declare class StoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    getStoreByPath(storeType: string, branchId: string): Promise<{
        id: string;
        okposBranchCode: string | null;
        storeType: string;
        branchId: string;
        name: string;
        branchName: string;
        type: import(".prisma/client").$Enums.StoreType;
        description: string | null;
        address: string | null;
        phoneNumber: string | null;
        businessHours: import("@prisma/client/runtime/library").JsonValue | null;
        theme: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string | null;
    }>;
    getStore(storeId: string): Promise<{
        id: string;
        okposBranchCode: string | null;
        storeType: string;
        branchId: string;
        name: string;
        branchName: string;
        type: import(".prisma/client").$Enums.StoreType;
        description: string | null;
        address: string | null;
        phoneNumber: string | null;
        businessHours: import("@prisma/client/runtime/library").JsonValue | null;
        theme: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string | null;
    }>;
}
