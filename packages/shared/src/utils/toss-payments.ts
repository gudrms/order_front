/**
 * 토스페이먼츠 결제 연동
 */

import { loadTossPayments, type TossPaymentsInstance } from '@tosspayments/payment-sdk';

/**
 * 토스페이먼츠 클라이언트 키
 * 실제 운영에서는 환경 변수로 관리 필요
 */
const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

/**
 * 토스페이먼츠 초기화
 */
export async function initTossPayments(): Promise<TossPaymentsInstance> {
    return await loadTossPayments(CLIENT_KEY);
}

/**
 * 결제 요청 파라미터
 */
export interface TossPaymentParams {
    amount: number;
    orderId: string;
    orderName: string;
    customerName?: string;
    customerEmail?: string;
    successUrl: string;
    failUrl: string;
}

/**
 * 결제 요청
 */
export async function requestPayment(params: TossPaymentParams) {
    const tossPayments = await initTossPayments();

    return tossPayments.requestPayment('카드', {
        amount: params.amount,
        orderId: params.orderId,
        orderName: params.orderName,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        successUrl: params.successUrl,
        failUrl: params.failUrl,
    });
}

/**
 * 주문 ID 생성 (UUID 대신 간단한 형식)
 */
export function generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORDER_${timestamp}_${random}`;
}
