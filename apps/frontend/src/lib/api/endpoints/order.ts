/**
 * Order API - Mock Implementation
 * localStorage 기반 주문 관리
 */

import type { CartSelectedOption } from '@/types';

/**
 * 주문 상태
 */
export type OrderStatus = 'PENDING' | 'COOKING' | 'COMPLETED' | 'CANCELLED';

/**
 * 주문 아이템 (생성 요청)
 */
export interface OrderItemInput {
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: CartSelectedOption[];
}

/**
 * 주문 생성 요청
 */
export interface CreateOrderRequest {
  tableNumber: number;
  items: OrderItemInput[];
  totalAmount: number;
}

/**
 * 주문 생성 응답
 */
export interface CreateOrderResponse {
  orderNumber: string; // "GM-001"
  createdAt: string;
}

/**
 * 주문 아이템 (저장/조회)
 */
export interface OrderItem extends OrderItemInput {
  id: string; // 아이템 고유 ID
}

/**
 * 주문 (저장/조회)
 */
export interface Order {
  id: string; // 주문 고유 ID (UUID)
  orderNumber: string; // 주문번호 (GM-001)
  tableNumber: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string; // ISO 8601
  okposOrderId?: string; // POS 연동 ID (나중에 사용)
}

/**
 * 주문번호 생성
 * Format: {branchCode}-{순번}
 * 예시: GM-001, GM-002 (매일 리셋)
 */
function generateOrderNumber(branchId: string): string {
  // branchId를 대문자 2자리 코드로 변환
  const branchCode = branchId.slice(0, 2).toUpperCase(); // "gimpo" → "GI", "gangnam" → "GA"

  // 오늘 날짜 (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const key = `order_count_${branchCode}_${today}`;

  // 오늘 주문 개수 가져오기
  const count = parseInt(localStorage.getItem(key) || '0') + 1;

  // 카운터 저장
  localStorage.setItem(key, count.toString());

  // 주문번호 생성 (3자리 패딩)
  return `${branchCode}-${count.toString().padStart(3, '0')}`;
}

/**
 * UUID 생성 (간단 버전)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 주문 생성
 */
export async function createOrder(
  data: CreateOrderRequest,
  branchId: string = 'gimpo' // 기본값: 김포점
): Promise<CreateOrderResponse> {
  // 지연 시뮬레이션 (실제 API 호출처럼)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 주문번호 생성
  const orderNumber = generateOrderNumber(branchId);

  // 주문 아이템에 ID 추가
  const items: OrderItem[] = data.items.map((item) => ({
    ...item,
    id: generateUUID(),
  }));

  // 주문 객체 생성
  const order: Order = {
    id: generateUUID(),
    orderNumber,
    tableNumber: data.tableNumber,
    items,
    totalAmount: data.totalAmount,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  // localStorage에 저장
  localStorage.setItem(`order_${orderNumber}`, JSON.stringify(order));

  // 주문 목록에 추가 (주문 내역 조회용)
  const orderListKey = `order_list_table_${data.tableNumber}`;
  const orderList: string[] = JSON.parse(
    localStorage.getItem(orderListKey) || '[]'
  );
  orderList.push(orderNumber);
  localStorage.setItem(orderListKey, JSON.stringify(orderList));

  return {
    orderNumber,
    createdAt: order.createdAt,
  };
}

/**
 * 주문 조회 (주문번호로)
 */
export async function getOrder(orderNumber: string): Promise<Order | null> {
  // 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300));

  const stored = localStorage.getItem(`order_${orderNumber}`);
  if (!stored) {
    return null;
  }

  return JSON.parse(stored) as Order;
}

/**
 * 테이블별 주문 목록 조회
 */
export async function getOrdersByTable(
  tableNumber: number
): Promise<Order[]> {
  // 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 300));

  const orderListKey = `order_list_table_${tableNumber}`;
  const orderNumbers: string[] = JSON.parse(
    localStorage.getItem(orderListKey) || '[]'
  );

  const orders: Order[] = [];
  for (const orderNumber of orderNumbers) {
    const stored = localStorage.getItem(`order_${orderNumber}`);
    if (stored) {
      orders.push(JSON.parse(stored) as Order);
    }
  }

  // 최신순 정렬
  return orders.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * 주문 상태 변경 (주방용 - Phase 2)
 */
export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus
): Promise<Order | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const stored = localStorage.getItem(`order_${orderNumber}`);
  if (!stored) {
    return null;
  }

  const order: Order = JSON.parse(stored);
  order.status = status;

  localStorage.setItem(`order_${orderNumber}`, JSON.stringify(order));

  return order;
}
