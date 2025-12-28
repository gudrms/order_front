/**
 * 관리자 관련 API 엔드포인트
 */

import type { Order, OrderStatus } from '@/types';
import { apiClient } from '../client';

/**
 * 관리자 주문 목록 조회
 * @param storeId - 매장 ID
 * @param status - 주문 상태 필터 (선택)
 */
export async function getAdminOrders(
  storeId: string,
  status?: OrderStatus
): Promise<Order[]> {
  const endpoint = status
    ? `/admin/stores/${storeId}/orders?status=${status}`
    : `/admin/stores/${storeId}/orders`;

  return apiClient.get<Order[]>(endpoint);
}

/**
 * 주문 상태 변경
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  return apiClient.patch<Order>(`/admin/orders/${orderId}/status`, {
    status,
  });
}

/**
 * 메뉴 품절 처리
 */
export async function updateMenuSoldOut(
  menuId: string,
  soldOut: boolean
): Promise<void> {
  return apiClient.patch<void>(`/admin/menus/${menuId}/soldout`, {
    soldOut,
  });
}
