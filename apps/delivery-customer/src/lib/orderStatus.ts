import type { OrderStatus } from '@order/shared';

/**
 * 고객에게 보여주는 주문 단계.
 * 매장(관리자)은 세부 상태(접수·조리·준비 완료·라이더 배정…)를 쓰지만,
 * 고객 화면은 이 5단계로만 안내한다. 진행 막대·주문 목록·주문 상세가 모두 이 기준을 쓴다.
 */
export type CustomerOrderStage = 'WAITING' | 'COOKING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

export const CUSTOMER_ORDER_STAGE_LABEL: Record<CustomerOrderStage, string> = {
    WAITING: '접수 대기',
    COOKING: '조리 중',
    DELIVERING: '배달 중',
    DELIVERED: '배달 완료',
    CANCELLED: '취소',
};

const STAGE_BY_STATUS: Record<OrderStatus, CustomerOrderStage> = {
    PENDING_PAYMENT: 'WAITING',
    PAID: 'WAITING',
    PENDING: 'WAITING',
    // 접수와 동시에 조리가 시작되므로 '접수 완료'를 따로 두지 않는다
    CONFIRMED: 'COOKING',
    COOKING: 'COOKING',
    PREPARING: 'COOKING',
    // 조리가 끝나 출발을 기다리는 상태 — 이미 만든 음식을 '조리 중'으로 안내하지 않는다
    READY: 'DELIVERING',
    DELIVERING: 'DELIVERING',
    COMPLETED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
};

export function toCustomerOrderStage(status: OrderStatus | string | null | undefined): CustomerOrderStage {
    return STAGE_BY_STATUS[status as OrderStatus] ?? 'WAITING';
}

export function getCustomerOrderStatusLabel(status: OrderStatus | string | null | undefined): string {
    return CUSTOMER_ORDER_STAGE_LABEL[toCustomerOrderStage(status)];
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
    READY: '결제 대기',
    PENDING: '결제 대기',
    PAID: '결제 완료',
    FAILED: '결제 실패',
    CANCELLED: '결제 취소',
    REFUNDED: '환불 완료',
    PARTIAL_REFUNDED: '부분 환불',
};

export function getPaymentStatusLabel(paymentStatus: string | null | undefined): string {
    if (!paymentStatus) return '-';
    return PAYMENT_STATUS_LABEL[paymentStatus] ?? paymentStatus;
}
