/**
 * 주문 관련 공통 타입 정의
 * Frontend ↔ Backend 공유
 */

/**
 * 주문 상태 (Prisma enum과 일치)
 */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'COOKING' | 'COMPLETED' | 'CANCELLED';

/**
 * 선택된 옵션 항목
 */
export interface SelectedOptionItem {
  optionItemId: string; // UUID
  name: string;
  price: number;
}

/**
 * 선택된 옵션 그룹
 */
export interface SelectedOption {
  optionGroupId: string; // UUID
  optionGroupName: string;
  items: SelectedOptionItem[];
}

/**
 * 장바구니용 간소화된 옵션 타입
 * UI 컴포넌트와 cartStore에서 사용
 */
export interface CartSelectedOption {
  id: string; // 옵션 그룹 ID (UUID)
  groupName: string; // 옵션 그룹 이름 (예: "사이즈", "토핑")
  itemId: string; // 옵션 아이템 ID (UUID)
  itemName: string; // 옵션 아이템 이름 (예: "2인분", "치즈추가")
  price: number; // 옵션 아이템 가격
}

/**
 * 주문 항목
 */
export interface OrderItem {
  id: string; // UUID
  orderId: string; // UUID
  menuId: string; // UUID
  menuName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: SelectedOption[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 주문
 */
export interface Order {
  id: string; // UUID
  orderNumber: string; // 주문 번호 (예: "ORD-20241231-0001")
  tableId: string; // UUID
  tableNumber?: number; // JOIN 결과
  storeId: string; // UUID
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  okposOrderId: string | null; // OKPOS 주문 ID
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt: Date | string | null;
}

/**
 * 주문 생성 요청 DTO
 */
export interface CreateOrderRequest {
  tableId: string; // UUID
  storeId: string; // UUID
  items: {
    menuId: string; // UUID
    quantity: number;
    options?: {
      optionGroupId: string; // UUID
      optionItemIds: string[]; // UUID[]
    }[];
  }[];
}

/**
 * 주문 상태 변경 요청 DTO
 */
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

/**
 * 주문 목록 조회 응답
 */
export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}
