/**
 * 주문 관련 API 엔드포인트
 */

import type { CreateOrderRequest, Order } from '@/types';
import { apiClient } from '../client';

/**
 * 주문 생성
 */
export async function createOrder(data: CreateOrderRequest): Promise<Order> {
  return apiClient.post<Order>('/orders', data);
}

/**
 * 테이블별 주문 내역 조회
 */
export async function getOrdersByTable(tableId: string): Promise<Order[]> {
  return apiClient.get<Order[]>(`/orders/table/${tableId}`);
}

/**
 * 주문 취소
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  return apiClient.post<Order>(`/orders/${orderId}/cancel`);
}
