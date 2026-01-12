/**
 * Order API - MSW 기반 주문 관리
 */

import type { CartSelectedOption } from '@order/shared';
import { DOMAINS } from '@/lib/constants/domains';

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
 * 주문 생성 (Mock / Local)
 */
export async function createOrder(
  request: CreateOrderRequest
): Promise<CreateOrderResponse> {
  const API_URL = DOMAINS.API;
  const storeId = 'store-1';

  // 실제 API 연동 시도
  try {
    // 1. 세션 조회
    const sessionResponse = await fetch(`${API_URL}/stores/${storeId}/tables/${request.tableNumber}/current-session`);
    const sessionData = await sessionResponse.json();
    
    if (sessionData.data) {
       const sessionId = sessionData.data.id;
       // 2. 주문 생성 (Session ID 기반)
       // NOTE: 백엔드 API 스펙에 따라 다를 수 있음. 일단은 Mock 응답 반환.
       // 실제로는: await fetch(`${API_URL}/stores/${storeId}/orders`, ... );
    }
  } catch (e) {
    console.warn('Backend connection failed, falling back to mock', e);
  }

  // Mock 응답
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    orderNumber: `ORD-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 테이블별 주문 목록 조회
 * MSW를 사용하여 세션 기반으로 주문 조회
 */
export async function getOrdersByTable(
  tableNumber: number
): Promise<Order[]> {
  const API_URL = DOMAINS.API;
  const storeId = 'store-1'; // 실제로는 context에서 가져와야 함

  // 현재 활성 세션 조회
  const sessionResponse = await fetch(`${API_URL}/stores/${storeId}/tables/${tableNumber}/current-session`);
  const sessionData = await sessionResponse.json();

  if (!sessionData.data) {
    // 활성 세션이 없으면 빈 배열 반환
    return [];
  }

  const sessionId = sessionData.data.id;

  // 세션의 주문 내역 조회
  const ordersResponse = await fetch(`${API_URL}/stores/${storeId}/orders?sessionId=${sessionId}`);
  const ordersData = await ordersResponse.json();

  return ordersData.data || [];
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
