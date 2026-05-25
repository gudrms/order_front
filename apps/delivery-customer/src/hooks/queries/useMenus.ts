import { useQuery } from '@tanstack/react-query';
import type { Menu, MenuCategory, MenuDetail } from '@order/shared';
import { getDeliveryCategories, getDeliveryMenuDetail, getDeliveryMenus } from '@/lib/public-api-client';

export function useCategories(storeId?: string | null) {
    return useQuery<MenuCategory[]>({
        queryKey: ['categories', storeId],
        queryFn: () => getDeliveryCategories(storeId!),
        enabled: !!storeId,
        staleTime: 5 * 60 * 1000,
        meta: { errorToast: true },
    });
}

export function useMenus(storeId?: string | null, categoryId?: string) {
    return useQuery<Menu[]>({
        queryKey: ['menus', storeId, categoryId],
        queryFn: () => getDeliveryMenus(storeId!, categoryId),
        enabled: !!storeId,
        staleTime: 5 * 60 * 1000,
        meta: { errorToast: true },
    });
}

export function useMenuDetail(menuId?: string) {
    return useQuery<MenuDetail>({
        queryKey: ['menu', menuId],
        queryFn: () => getDeliveryMenuDetail(menuId!),
        enabled: !!menuId,
        staleTime: 5 * 60 * 1000,
    });
}
