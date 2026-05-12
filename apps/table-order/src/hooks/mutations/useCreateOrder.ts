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

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['orders', 'table', storeId, variables.tableNumber],
      });
    },
  });
}
