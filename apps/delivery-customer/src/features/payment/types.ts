/**
 * 결제 수단
 */
export type PaymentMethod =
  | 'CARD'           // 신용카드/체크카드
  | 'KAKAO_PAY'      // 카카오페이
  | 'NAVER_PAY'      // 네이버페이
  | 'TOSS'           // 토스
  | 'SAMSUNG_PAY'    // 삼성페이
  | 'PAYCO';         // 페이코

/**
 * 결제 정보
 */
export interface PaymentInfo {
  method: PaymentMethod;
  amount: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
}

/**
 * 결제 결과
 */
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

/**
 * 결제 수단 정보
 */
export const PAYMENT_METHODS: Record<
  PaymentMethod,
  { name: string; icon: string; available: boolean }
> = {
  CARD: {
    name: '신용/체크카드',
    icon: '💳',
    available: true,
  },
  KAKAO_PAY: {
    name: '카카오페이',
    icon: '💛',
    available: true,
  },
  NAVER_PAY: {
    name: '네이버페이',
    icon: '💚',
    available: true,
  },
  TOSS: {
    name: '토스',
    icon: '💙',
    available: true,
  },
  SAMSUNG_PAY: {
    name: '삼성페이',
    icon: '📱',
    available: true,
  },
  PAYCO: {
    name: '페이코',
    icon: '🅿️',
    available: true,
  },
};
