/**
 * 메뉴 관련 공통 타입 정의
 * Frontend ↔ Backend 공유
 */

/**
 * 메뉴 카테고리
 */
export interface MenuCategory {
  id: string; // UUID
  name: string;
  description?: string | null;
  displayOrder: number;
  storeId: string; // UUID
  createdAt: Date | string;
  updatedAt: Date | string;
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
  displayOrder?: number; // 선택적 (Mock 데이터에서 생략 가능)
  isAvailable?: boolean; // 선택적 (기본값: true)
}

/**
 * 메뉴 옵션 그룹
 */
export interface MenuOptionGroup {
  id: string; // UUID
  name: string;
  type: MenuOptionType;
  required: boolean;
  displayOrder?: number; // 선택적 (Mock에서 생략 가능)
  options: MenuOptionItem[];
}

/**
 * @deprecated Use MenuOptionGroup instead
 * 하위 호환성을 위한 alias
 */
export type MenuOption = MenuOptionGroup;

/**
 * 메뉴
 */
export interface Menu {
  id: string; // UUID
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  categoryId: string; // UUID
  categoryName?: string; // JOIN 결과
  soldOut: boolean;
  isHidden?: boolean; // 선택적 (Mock에서 생략 가능, 기본값: false)
  isActive?: boolean; // 선택적 (Mock에서 생략 가능, 기본값: true)
  displayOrder: number;
  storeId?: string; // UUID (선택적, Mock에서 생략 가능)
  okposMenuId?: string | null; // OKPOS 메뉴 ID (선택적)
  optionGroups?: MenuOptionGroup[]; // 옵션 그룹 (선택적, JOIN 결과)
  createdAt?: Date | string; // 선택적 (Mock에서 생략 가능)
  updatedAt?: Date | string; // 선택적 (Mock에서 생략 가능)
}

/**
 * 메뉴 상세 (옵션 포함)
 */
export interface MenuDetail extends Menu {
  optionGroups: MenuOptionGroup[];
}

/**
 * 메뉴 생성/수정 요청 DTO
 */
export interface CreateMenuRequest {
  name: string;
  price: number;
  description?: string;
  categoryId: string; // UUID
  imageUrl?: string | null;
  soldOut?: boolean;
  displayOrder?: number;
  storeId: string; // UUID
}

export interface UpdateMenuRequest extends Partial<CreateMenuRequest> {
  id: string; // UUID
}
