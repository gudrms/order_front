import { PrismaService } from '../prisma/prisma.service';
export declare class MenusService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCategories(storeId: string): Promise<{
        id: string;
        storeId: string;
        okposCategoryCode: string | null;
        name: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getMenus(storeId: string, categoryId?: string): Promise<({
        category: {
            id: string;
            name: string;
        };
        optionGroups: ({
            options: {
                id: string;
                name: string;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
                price: number;
                optionGroupId: string;
                okposOptionCode: string | null;
                isSoldOut: boolean;
            }[];
        } & {
            id: string;
            name: string;
            displayOrder: number;
            menuId: string;
            minSelect: number;
            maxSelect: number;
        })[];
        tags: ({
            tag: {
                id: string;
                storeId: string;
                name: string;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
                icon: string | null;
                color: string;
                backgroundColor: string;
            };
        } & {
            id: string;
            createdAt: Date;
            menuId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        name: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        okposMenuCode: string | null;
        price: number;
        description: string | null;
        imageUrl: string | null;
        soldOut: boolean;
        isHidden: boolean;
        isActive: boolean;
        lastSyncedAt: Date;
    })[]>;
    getMenuDetail(menuId: string): Promise<{
        category: {
            id: string;
            name: string;
        };
        optionGroups: ({
            options: {
                id: string;
                name: string;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
                price: number;
                optionGroupId: string;
                okposOptionCode: string | null;
                isSoldOut: boolean;
            }[];
        } & {
            id: string;
            name: string;
            displayOrder: number;
            menuId: string;
            minSelect: number;
            maxSelect: number;
        })[];
        tags: ({
            tag: {
                id: string;
                storeId: string;
                name: string;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
                icon: string | null;
                color: string;
                backgroundColor: string;
            };
        } & {
            id: string;
            createdAt: Date;
            menuId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        name: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        okposMenuCode: string | null;
        price: number;
        description: string | null;
        imageUrl: string | null;
        soldOut: boolean;
        isHidden: boolean;
        isActive: boolean;
        lastSyncedAt: Date;
    }>;
}
