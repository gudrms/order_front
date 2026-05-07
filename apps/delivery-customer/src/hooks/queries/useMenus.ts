import { useQuery } from '@tanstack/react-query';
import { api } from '@order/shared/api';
import type { Menu, MenuCategory, MenuDetail } from '@order/shared';

export function useCategories(storeId?: string | null) {
    return useQuery<MenuCategory[]>({
        queryKey: ['categories', storeId],
        queryFn: () => api.menu.getCategories(storeId!),
        enabled: !!storeId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useMenus(storeId?: string | null, categoryId?: string) {
    return useQuery<Menu[]>({
        queryKey: ['menus', storeId, categoryId],
        queryFn: () => api.menu.getMenus(storeId!, categoryId),
        enabled: !!storeId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useMenuDetail(menuId?: string) {
    return useQuery<MenuDetail>({
        queryKey: ['menu', menuId],
        queryFn: () => api.menu.getMenuDetail(menuId!),
        enabled: !!menuId,
        staleTime: 5 * 60 * 1000,
    });
}
