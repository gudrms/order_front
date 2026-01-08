/**
 * 주문 관련 Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@order/shared';
import type { Order } from '@/lib/api/endpoints/order';

/**
 * 테이블별 주문 내역 조회 훅
 * Mock API는 tableNumber(number)를 사용
 */
export function useOrdersByTable(tableNumber?: number) {
  return useQuery<Order[]>({
    queryKey: ['orders', 'table', tableNumber],
    queryFn: () => api.order.getOrdersByTable(tableNumber!),
    enabled: !!tableNumber,
  });
}
