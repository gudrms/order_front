import type { Store } from '../../types';
import { apiClient } from '../client';

export async function getStore(storeId: string): Promise<Store> {
    return apiClient.get<Store>(`/stores/${storeId}`);
}

export async function getStoreByIdentifier(
    storeType: string,
    branchId: string
): Promise<Store> {
    return apiClient.get<Store>(`/stores/identifier/${storeType}/${branchId}`);
}
