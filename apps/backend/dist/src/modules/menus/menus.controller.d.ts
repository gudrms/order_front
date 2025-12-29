import { MenusService } from './menus.service';
export declare class MenusController {
    private readonly menusService;
    constructor(menusService: MenusService);
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
                menuId: string;
                displayOrder: number;
                minSelect: number;
                maxSelect: number;
            })[];
            tags: ({
                tag: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    storeId: string;
                    displayOrder: number;
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
            name: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            description: string | null;
            isActive: boolean;
            displayOrder: number;
            categoryId: string;
            okposMenuCode: string | null;
            price: number;
            imageUrl: string | null;
            soldOut: boolean;
            isHidden: boolean;
            lastSyncedAt: Date;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        okposCategoryCode: string | null;
        displayOrder: number;
    })[]>;
}
