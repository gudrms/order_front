/**
 * 주문 관련 타입 정의
 */

/**
 * 주문 상태
 */
export type OrderStatus = 'PENDING' | 'COOKING' | 'SERVED' | 'CANCELLED';

/**
 * 주문 상태 한글 매핑
 */
export const OrderStatusLabel: Record<OrderStatus, string> = {
  PENDING: '접수됨',
  COOKING: '조리중',
  SERVED: '서빙완료',
  CANCELLED: '취소됨',
};

/**
 * 선택된 옵션 항목
 */
export interface SelectedOptionItem {
  optionItemId: number;
  name: string;
  price: number;
}

/**
 * 선택된 옵션
 */
export interface SelectedOption {
  optionId: number;
  optionName: string;
  items: SelectedOptionItem[];
}

/**
 * 장바구니용 간소화된 옵션 타입
 * UI 컴포넌트와 cartStore에서 사용
 */
export interface CartSelectedOption {
  id: number; // 옵션 그룹 ID
  itemId: number; // 옵션 아이템 ID
  name: string; // 옵션 아이템 이름
  price: number; // 옵션 아이템 가격
}

/**
 * 주문 항목
 */
export interface OrderItem {
  id?: number;
  menuId: number;
  menuName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: SelectedOption[];
}

/**
 * 주문
 */
export interface Order {
  id: number;
  tableId: number;
  tableNumber?: number;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

/**
 * 주문 생성 요청 DTO
 */
export interface CreateOrderRequest {
  tableId: number;
  items: {
    menuId: number;
    quantity: number;
    options?: {
      optionId: number;
      optionItemIds: number[];
    }[];
  }[];
}

/**
 * 주문 상태 변경 요청 DTO
 */
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
