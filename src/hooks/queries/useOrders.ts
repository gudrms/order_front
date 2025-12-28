/**
 * 주문 관련 Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Order } from '@/types';

/**
 * 테이블별 주문 내역 조회 훅
 */
export function useOrdersByTable(tableId?: string) {
  return useQuery<Order[]>({
    queryKey: ['orders', 'table', tableId],
    queryFn: () => api.order.getOrdersByTable(tableId!),
    enabled: !!tableId,
  });
}
