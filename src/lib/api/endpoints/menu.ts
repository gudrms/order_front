/**
 * 메뉴 관련 API 엔드포인트
 */

import type { Menu, MenuCategory, MenuDetail } from '@/types';
import { apiClient } from '../client';

/**
 * 카테고리 목록 조회
 */
export async function getCategories(storeId: number): Promise<MenuCategory[]> {
  return apiClient.get<MenuCategory[]>(`/stores/${storeId}/categories`);
}

/**
 * 메뉴 목록 조회
 * @param storeId - 매장 ID
 * @param categoryId - 카테고리 ID (선택)
 */
export async function getMenus(
  storeId: number,
  categoryId?: number
): Promise<Menu[]> {
  const endpoint = categoryId
    ? `/stores/${storeId}/menus?categoryId=${categoryId}`
    : `/stores/${storeId}/menus`;

  return apiClient.get<Menu[]>(endpoint);
}

/**
 * 메뉴 상세 조회
 */
export async function getMenuDetail(menuId: number): Promise<MenuDetail> {
  return apiClient.get<MenuDetail>(`/menus/${menuId}`);
}
