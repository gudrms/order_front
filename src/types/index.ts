/**
 * 타입 정의 통합 export
 * 사용 예: import { Menu, Order, Table } from '@/types';
 */

// API 공통 타입
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ApiStatus,
} from './api';

// 메뉴 타입
export type {
  MenuCategory,
  MenuOptionType,
  MenuOptionItem,
  MenuOption,
  Menu,
  MenuDetail,
  MenuFormData,
} from './menu';

// 주문 타입
export type {
  OrderStatus,
  SelectedOptionItem,
  SelectedOption,
  CartSelectedOption,
  OrderItem,
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
} from './order';
export { OrderStatusLabel } from './order';

// 테이블 타입
export type { TableStatus, Table, UpdateTableStatusRequest } from './table';
export { TableStatusLabel } from './table';

// 직원 호출 타입
export type { CallType, CallStatus, Call, CreateCallRequest } from './call';
export { CallTypeLabel, CallStatusLabel } from './call';
