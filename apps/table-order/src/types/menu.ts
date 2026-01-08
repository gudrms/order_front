/**
 * 메뉴 관련 타입 정의
 */

/**
 * 메뉴 카테고리
 */
export interface MenuCategory {
  id: string; // UUID
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
  id: string; // UUID
  name: string;
  price: number;
}

/**
 * 메뉴 옵션 그룹
 */
export interface MenuOption {
  id: string; // UUID
  name: string;
  type: MenuOptionType;
  required: boolean;
  options: MenuOptionItem[];
}

/**
 * 메뉴
 */
export interface Menu {
  id: string; // UUID
  name: string;
  price: number;
  description: string;
  imageUrl: string | null;
  categoryId: string; // UUID
  categoryName?: string;
  soldOut: boolean;
  displayOrder: number;
  optionGroups?: any[]; // 옵션 그룹 목록
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 메뉴 상세 (옵션 포함)
 */
export interface MenuDetail extends Menu {
  optionGroups: any[];
}

/**
 * 메뉴 생성/수정 요청 DTO
 */
export interface MenuFormData {
  name: string;
  price: number;
  description: string;
  categoryId: string;
  imageUrl?: string | null;
  soldOut?: boolean;
  displayOrder?: number;
}
