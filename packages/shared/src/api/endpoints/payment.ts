import type { ConfirmTossPaymentRequest, FailTossPaymentRequest, OrderResponse } from '../../types';
import { apiClient } from '../client';

export async function confirmTossPayment(
    request: ConfirmTossPaymentRequest
): Promise<OrderResponse> {
    return apiClient.post<OrderResponse>('/payments/toss/confirm', request);
}

export async function failTossPayment(
    request: FailTossPaymentRequest
): Promise<OrderResponse> {
    return apiClient.post<OrderResponse>('/payments/toss/fail', request);
}
