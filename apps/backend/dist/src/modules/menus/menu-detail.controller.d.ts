import { MenusService } from './menus.service';
export declare class MenuDetailController {
    private readonly menusService;
    constructor(menusService: MenusService);
    getMenuDetail(menuId: string): Promise<{
        category: {
            id: string;
            name: string;
        };
        optionGroups: ({
            options: {
                id: string;
                name: string;
                price: number;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
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
        categoryId: string;
        okposMenuCode: string | null;
        name: string;
        price: number;
        description: string | null;
        imageUrl: string | null;
        displayOrder: number;
        soldOut: boolean;
        isHidden: boolean;
        isActive: boolean;
        lastSyncedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
