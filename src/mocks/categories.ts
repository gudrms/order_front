import type { MenuCategory } from '@/types';

/**
 * Mock 카테고리 데이터
 * UUID 형식: cat-{number}-{name}
 */
export const mockCategories: MenuCategory[] = [
  {
    id: 'cat-1-chicken',
    name: '치킨',
    description: '바삭하고 맛있는 치킨 메뉴',
    displayOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-2-pizza',
    name: '피자',
    description: '다양한 토핑의 수제 피자',
    displayOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-3-pasta',
    name: '파스타',
    description: '정통 이탈리안 파스타',
    displayOrder: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-4-drink',
    name: '음료',
    description: '시원한 음료와 주류',
    displayOrder: 4,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-5-dessert',
    name: '디저트',
    description: '달콤한 디저트 메뉴',
    displayOrder: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];
