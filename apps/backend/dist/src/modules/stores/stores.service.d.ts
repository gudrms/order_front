import { PrismaService } from '../prisma/prisma.service';
export declare class StoresService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStore(storeId: string): Promise<{
        id: string;
        name: string;
        phoneNumber: string | null;
        createdAt: Date;
        updatedAt: Date;
        okposBranchCode: string | null;
        storeType: string;
        branchId: string;
        branchName: string;
        type: import(".prisma/client").$Enums.StoreType;
        description: string | null;
        address: string | null;
        businessHours: import("@prisma/client/runtime/library").JsonValue | null;
        theme: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        ownerId: string | null;
    }>;
    getStoreByPath(storeType: string, branchId: string): Promise<{
        id: string;
        name: string;
        phoneNumber: string | null;
        createdAt: Date;
        updatedAt: Date;
        okposBranchCode: string | null;
        storeType: string;
        branchId: string;
        branchName: string;
        type: import(".prisma/client").$Enums.StoreType;
        description: string | null;
        address: string | null;
        businessHours: import("@prisma/client/runtime/library").JsonValue | null;
        theme: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        ownerId: string | null;
    }>;
}
