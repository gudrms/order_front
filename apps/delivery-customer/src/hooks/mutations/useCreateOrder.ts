/**
 * 주문 생성 Mutation Hook
 */

import { useMutation } from '@tanstack/react-query';
import { createOrder } from '@order/shared';
import type { CreateOrderRequest, OrderResponse } from '@order/shared';

export function useCreateOrder() {
    return useMutation<OrderResponse, Error, CreateOrderRequest>({
        mutationFn: createOrder,
    });
}
