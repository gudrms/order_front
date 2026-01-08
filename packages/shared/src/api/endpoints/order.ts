/**
 * Order API
 */

import type { Order, OrderStatus, CreateOrderRequest, OrderResponse } from '../../types';
import { apiClient } from '../client';

/**
 * 테이블별 주문 목록 조회
 * MSW를 사용하여 세션 기반으로 주문 조회
 */
export async function getOrdersByTable(
    tableNumber: number
): Promise<Order[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
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
 * 주문 생성 (배달/포장/매장)
 */
export async function createOrder(
    request: CreateOrderRequest
): Promise<OrderResponse> {
    return apiClient.post<OrderResponse>('/orders', request);
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
