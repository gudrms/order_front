import type { Menu, MenuCategory, MenuDetail, Store } from '@order/shared';
import { ApiClientError } from '@order/shared/api/client';

export function getDeliveryStores(): Promise<Store[]> {
    return getPublicJson<Store[]>('/api/stores');
}

export function getDeliveryStore(storeId: string): Promise<Store> {
    return getPublicJson<Store>(`/api/stores/${storeId}`);
}

export function getDeliveryCategories(storeId: string): Promise<MenuCategory[]> {
    return getPublicJson<MenuCategory[]>(`/api/stores/${storeId}/categories`);
}

export function getDeliveryMenus(storeId: string, categoryId?: string): Promise<Menu[]> {
    const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    return getPublicJson<Menu[]>(`/api/stores/${storeId}/menus${query}`);
}

export function getDeliveryMenuDetail(menuId: string): Promise<MenuDetail> {
    return getPublicJson<MenuDetail>(`/api/menus/${menuId}`);
}

async function getPublicJson<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
    });
    const data = await readJson(response);

    if (!response.ok) {
        throw new ApiClientError(
            response.status,
            getErrorCode(data),
            getErrorMessage(data),
            data,
        );
    }

    return data as T;
}

async function readJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function getErrorCode(data: unknown) {
    if (data && typeof data === 'object' && 'code' in data && typeof data.code === 'string') {
        return data.code;
    }

    return 'PUBLIC_API_ERROR';
}

function getErrorMessage(data: unknown) {
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
        return data.message;
    }

    return '요청에 실패했습니다.';
}
