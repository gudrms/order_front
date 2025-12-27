/**
 * 메뉴 관련 타입 정의
 */

/**
 * 메뉴 카테고리
 */
export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 메뉴 옵션 타입
 */
export type MenuOptionType = 'SINGLE' | 'MULTIPLE';

/**
 * 메뉴 옵션 항목
 */
export interface MenuOptionItem {
  id: number;
  name: string;
  price: number;
}

/**
 * 메뉴 옵션
 */
export interface MenuOption {
  id: number;
  name: string;
  type: MenuOptionType;
  required: boolean;
  items: MenuOptionItem[];
}

/**
 * 메뉴
 */
export interface Menu {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string | null;
  categoryId: number;
  categoryName?: string;
  soldOut: boolean;
  displayOrder: number;
  options?: MenuOption[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 메뉴 상세 (옵션 포함)
 */
export interface MenuDetail extends Menu {
  options: MenuOption[];
}

/**
 * 메뉴 생성/수정 요청 DTO
 */
export interface MenuFormData {
  name: string;
  price: number;
  description: string;
  categoryId: number;
  imageUrl?: string | null;
  soldOut?: boolean;
  displayOrder?: number;
}
