/**
 * 주문 생성 Mutation 훅
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
} from '@/lib/api/endpoints/order';

import { useStore } from '@/contexts/StoreContext';

/**
 * 주문 생성 훅
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { id: storeId } = useStore();

  return useMutation<CreateOrderResponse, Error, CreateOrderRequest>({
    mutationFn: (data) => api.order.createOrder(data, storeId),

    // 성공 시 주문 목록 쿼리 무효화
    onSuccess: (data) => {
      // 해당 테이블의 주문 목록 쿼리 무효화
      // Note: CreateOrderResponse에는 tableId가 없으므로 모든 주문 무효화
      queryClient.invalidateQueries({
        queryKey: ['orders'],
      });
    },
  });
}
