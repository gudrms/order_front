/**
 * 토스페이먼츠 결제 연동
 */

import { loadTossPayments, type TossPaymentsInstance } from '@tosspayments/payment-sdk';

/**
 * 토스페이먼츠 클라이언트 키
 * 실제 운영에서는 환경 변수로 관리 필요.
 * 이 유틸은 @tosspayments/payment-sdk 기반의 기존 결제창용입니다.
 * 결제위젯은 apps/delivery-customer checkout에서 @tosspayments/payment-widget-sdk를 사용합니다.
 */
const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

/**
 * 토스페이먼츠 초기화
 */
export async function initTossPayments(): Promise<TossPaymentsInstance> {
    if (!CLIENT_KEY) {
        throw new Error('NEXT_PUBLIC_TOSS_CLIENT_KEY is required to initialize Toss Payments');
    }

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

// generateOrderId 는 utils/id.ts 로 이동 (SSR 안전)
