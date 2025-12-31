export interface MenuCategory {
    id: string;
    name: string;
    description?: string | null;
    displayOrder: number;
    storeId: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}
export type MenuOptionType = 'SINGLE' | 'MULTIPLE';
export interface MenuOptionItem {
    id: string;
    name: string;
    price: number;
    displayOrder?: number;
    isAvailable?: boolean;
}
export interface MenuOptionGroup {
    id: string;
    name: string;
    type: MenuOptionType;
    required: boolean;
    displayOrder?: number;
    options: MenuOptionItem[];
}
export type MenuOption = MenuOptionGroup;
export interface Menu {
    id: string;
    name: string;
    price: number;
    description: string | null;
    imageUrl: string | null;
    categoryId: string;
    categoryName?: string;
    soldOut: boolean;
    isHidden?: boolean;
    isActive?: boolean;
    displayOrder: number;
    storeId?: string;
    okposMenuId?: string | null;
    optionGroups?: MenuOptionGroup[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
export interface MenuDetail extends Menu {
    optionGroups: MenuOptionGroup[];
}
export interface CreateMenuRequest {
    name: string;
    price: number;
    description?: string;
    categoryId: string;
    imageUrl?: string | null;
    soldOut?: boolean;
    displayOrder?: number;
    storeId: string;
}
export interface UpdateMenuRequest extends Partial<CreateMenuRequest> {
    id: string;
}
