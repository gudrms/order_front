import { StoresService } from './stores.service';
export declare class StoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    getStore(storeId: string): Promise<{
        id: string;
        storeType: string;
        branchId: string;
        name: string;
        branchName: string;
        type: import(".prisma/client").$Enums.StoreType;
        okposBranchCode: string | null;
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
