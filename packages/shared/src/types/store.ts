export type StoreType = 'MEXICAN' | 'PUB' | 'JAPANESE' | 'KOREAN' | 'CHINESE' | 'WESTERN' | 'CAFE' | 'GENERAL';
export type MenuManagementMode = 'TOSS_POS' | 'ADMIN_DIRECT';

export interface Store {
  id: string;
  storeType: string;
  branchId: string;
  name: string;
  branchName: string;
  type: StoreType;
  menuManagementMode: MenuManagementMode;
  inviteCode?: string | null;
  tossBranchCode: string | null;
  description: string | null;
  address: string | null;
  phoneNumber: string | null;
  businessHours: Record<string, any> | null;
  theme: Record<string, any> | null;
  isActive: boolean;
  isDeliveryEnabled: boolean;
  minimumOrderAmount: number;
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  deliveryRadiusMeters: number | null;
  estimatedDeliveryMinutes: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FavoriteStore {
  id: string;
  userId: string;
  storeId: string;
  store: Store;
  createdAt: Date | string;
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
