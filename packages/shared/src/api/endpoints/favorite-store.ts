import type { FavoriteStore } from '../../types';
import { apiClient } from '../client';

export async function getFavoriteStores(): Promise<FavoriteStore[]> {
    return apiClient.get<FavoriteStore[]>('/users/me/favorite-stores');
}

export async function toggleFavoriteStore(storeId: string): Promise<{ isFavorite: boolean }> {
    return apiClient.post<{ isFavorite: boolean }>(`/users/me/favorite-stores/${storeId}/toggle`);
}
