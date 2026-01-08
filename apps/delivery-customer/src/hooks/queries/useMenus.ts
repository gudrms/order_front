/**
 * 메뉴 관련 Query 훅 (배달 앱용)
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@order/shared';
import type { Menu, MenuCategory, MenuDetail } from '@order/shared';

// TODO: 실제 매장 ID를 Context나 Store에서 가져와야 함
const DEFAULT_STORE_ID = 'store-1';

/**
 * 카테고리 목록 조회 훅
 */
export function useCategories(storeId: string = DEFAULT_STORE_ID) {
    return useQuery<MenuCategory[]>({
        queryKey: ['categories', storeId],
        queryFn: () => api.menu.getCategories(storeId),
        enabled: !!storeId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * 메뉴 목록 조회 훅
 */
export function useMenus(storeId: string = DEFAULT_STORE_ID, categoryId?: string) {
    return useQuery<Menu[]>({
        queryKey: ['menus', storeId, categoryId],
        queryFn: () => api.menu.getMenus(storeId, categoryId),
        enabled: !!storeId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * 메뉴 상세 조회 훅
 */
export function useMenuDetail(menuId?: string) {
    return useQuery<MenuDetail>({
        queryKey: ['menu', menuId],
        queryFn: () => api.menu.getMenuDetail(menuId!),
        enabled: !!menuId,
        staleTime: 5 * 60 * 1000,
    });
}
