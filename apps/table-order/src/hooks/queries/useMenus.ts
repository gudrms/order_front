/**
 * 메뉴 관련 Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@order/shared/api';
import type { Menu, MenuCategory, MenuDetail } from '@order/shared';

/**
 * 카테고리 목록 조회 훅
 */
export function useCategories(storeId: string) {
  return useQuery<MenuCategory[]>({
    queryKey: ['categories', storeId],
    queryFn: () => api.menu.getCategories(storeId),
    enabled: !!storeId,
    // 캐싱 설정
    staleTime: 5 * 60 * 1000, // 5분간 신선한 데이터로 간주
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}

/**
 * 메뉴 목록 조회 훅
 */
export function useMenus(storeId: string, categoryId?: string) {
  return useQuery<Menu[]>({
    queryKey: ['menus', storeId, categoryId],
    queryFn: () => api.menu.getMenus(storeId, categoryId),
    enabled: !!storeId,
    // 캐싱 설정
    staleTime: 5 * 60 * 1000, // 5분간 신선한 데이터로 간주
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
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
    // 캐싱 설정
    staleTime: 5 * 60 * 1000, // 5분간 신선한 데이터로 간주
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}
