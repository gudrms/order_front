import { PrismaService } from '../prisma/prisma.service';
export declare class MenusService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMenus(storeId: string): Promise<({
        menus: ({
            optionGroups: ({
                options: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    displayOrder: number;
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
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    displayOrder: number;
                    storeId: string;
                    displayName: string;
                    icon: string | null;
                    color: string;
                    backgroundColor: string;
                };
            } & {
                id: string;
                createdAt: Date;
                tagId: string;
                menuId: string;
            })[];
        } & {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            displayOrder: number;
            storeId: string;
            okposMenuCode: string | null;
            price: number;
            imageUrl: string | null;
            soldOut: boolean;
            isHidden: boolean;
            lastSyncedAt: Date;
            categoryId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        okposCategoryCode: string | null;
        displayOrder: number;
        storeId: string;
    })[]>;
}
