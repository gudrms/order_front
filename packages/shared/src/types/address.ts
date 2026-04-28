export interface UserAddress {
    id: string;
    userId: string;
    name: string;
    address: string;
    detailAddress?: string | null;
    zipCode?: string | null;
    recipientName?: string | null;
    recipientPhone?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    deliveryMemo?: string | null;
    entranceMemo?: string | null;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserAddressRequest {
    name: string;
    address: string;
    detailAddress?: string;
    zipCode?: string;
    recipientName?: string;
    recipientPhone?: string;
    latitude?: number;
    longitude?: number;
    deliveryMemo?: string;
    entranceMemo?: string;
    isDefault?: boolean;
}

export type UpdateUserAddressRequest = Partial<CreateUserAddressRequest>;
