import { PaymentMethod } from '@prisma/client';

/**
 * Toss 결제 method 문자열을 내부 PaymentMethod enum 값으로 매핑.
 * Toss API는 한국어("카드")나 영문("Card")을 반환하므로 양쪽 모두 처리.
 */
export function mapTossMethod(method?: string): PaymentMethod {
    if (!method) {
        return PaymentMethod.TOSS;
    }

    return method === '카드' || method.toLowerCase().includes('card')
        ? PaymentMethod.CARD
        : PaymentMethod.TOSS;
}
