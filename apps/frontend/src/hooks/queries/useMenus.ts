/**
 * 메뉴 관련 Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Menu, MenuCategory, MenuDetail } from '@/types';
import { mockCategories, mockMenus, mockMenuDetails } from '@/mocks';

// Mock 모드 확인
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

/**
 * Mock 데이터 반환 헬퍼 함수
 */
function mockQuery<T>(data: T, delay = 500) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * 카테고리 목록 조회 훅
 */
export function useCategories(storeId: string) {
  return useQuery<MenuCategory[]>({
    queryKey: ['categories', storeId],
    queryFn: USE_MOCK
      ? () => mockQuery(mockCategories)
      : () => api.menu.getCategories(storeId),
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
    queryFn: USE_MOCK
      ? () => {
          // 카테고리 필터링
          const filteredMenus = categoryId
            ? mockMenus.filter((menu) => menu.categoryId === categoryId)
            : mockMenus;
          return mockQuery(filteredMenus);
        }
      : () => api.menu.getMenus(storeId, categoryId),
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
    queryFn: USE_MOCK
      ? () => {
          const menuDetail = mockMenuDetails[menuId!];
          if (!menuDetail) {
            throw new Error('Menu not found');
          }
          return mockQuery(menuDetail);
        }
      : () => api.menu.getMenuDetail(menuId!),
    enabled: !!menuId,
    // 캐싱 설정
    staleTime: 5 * 60 * 1000, // 5분간 신선한 데이터로 간주
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });
}
