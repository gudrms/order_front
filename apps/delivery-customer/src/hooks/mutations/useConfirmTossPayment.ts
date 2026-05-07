import { useMutation } from '@tanstack/react-query';
import { confirmTossPayment } from '@order/shared/api';
import type { ConfirmTossPaymentRequest, OrderResponse } from '@order/shared';

export function useConfirmTossPayment() {
    return useMutation<OrderResponse, Error, ConfirmTossPaymentRequest>({
        mutationFn: confirmTossPayment,
    });
}
