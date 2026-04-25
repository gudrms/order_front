import { useMutation } from '@tanstack/react-query';
import { failTossPayment } from '@order/shared';
import type { FailTossPaymentRequest, OrderResponse } from '@order/shared';

export function useFailTossPayment() {
    return useMutation<OrderResponse, Error, FailTossPaymentRequest>({
        mutationFn: failTossPayment,
    });
}
