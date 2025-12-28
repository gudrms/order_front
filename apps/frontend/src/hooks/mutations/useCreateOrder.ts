/**
 * 주문 생성 Mutation 훅
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateOrderRequest, Order } from '@/types';

/**
 * 주문 생성 훅
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, CreateOrderRequest>({
    mutationFn: (data) => api.order.createOrder(data),

    // 성공 시 주문 목록 쿼리 무효화
    onSuccess: (data) => {
      // 해당 테이블의 주문 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['orders', 'table', data.tableId],
      });
    },
  });
}
