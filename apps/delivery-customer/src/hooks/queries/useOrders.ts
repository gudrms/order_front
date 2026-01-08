/**
 * 주문 내역 조회 Hook
 */

import { useQuery } from '@tanstack/react-query';
import type { Order } from '@order/shared';

// TODO: 실제 API 연동
async function fetchOrders(): Promise<Order[]> {
    // 임시로 localStorage에서 가져오기
    const orders = localStorage.getItem('user_orders');
    if (!orders) return [];
    return JSON.parse(orders);
}

export function useOrders() {
    return useQuery({
        queryKey: ['orders'],
        queryFn: fetchOrders,
    });
}
