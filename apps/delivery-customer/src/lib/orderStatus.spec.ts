import { describe, expect, it } from 'vitest';
import { getCustomerOrderStatusLabel, getPaymentStatusLabel, toCustomerOrderStage } from './orderStatus';

describe('고객용 주문 단계', () => {
    it('매장의 세부 상태를 고객 5단계로 묶는다', () => {
        expect(toCustomerOrderStage('PAID')).toBe('WAITING');
        expect(toCustomerOrderStage('CONFIRMED')).toBe('COOKING');
        expect(toCustomerOrderStage('PREPARING')).toBe('COOKING');
        // 조리가 끝나 출발을 기다리는 주문을 '조리 중'으로 안내하지 않는다
        expect(toCustomerOrderStage('READY')).toBe('DELIVERING');
        expect(toCustomerOrderStage('COMPLETED')).toBe('DELIVERED');
        expect(toCustomerOrderStage('CANCELLED')).toBe('CANCELLED');
    });

    it("헷갈리던 '완료'·'결제 완료' 대신 고객 기준 이름을 쓴다", () => {
        expect(getCustomerOrderStatusLabel('COMPLETED')).toBe('배달 완료');
        expect(getCustomerOrderStatusLabel('PAID')).toBe('접수 대기');
        expect(getCustomerOrderStatusLabel('unknown')).toBe('접수 대기');
    });

    it('결제 상태를 한글로 보여준다', () => {
        expect(getPaymentStatusLabel('PAID')).toBe('결제 완료');
        expect(getPaymentStatusLabel('REFUNDED')).toBe('환불 완료');
        expect(getPaymentStatusLabel(null)).toBe('-');
    });
});
