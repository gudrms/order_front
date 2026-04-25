export type PaymentMethod = 'CARD' | 'TOSS' | 'KAKAO' | 'NAVER' | 'SAMSUNG' | 'PAYCO' | 'CASH';

export interface PaymentRequest {
    orderId: string;
    amount: number;
    paymentKey?: string;
    paymentType: 'NORMAL' | 'BRANDPAY' | 'KEY_IN';
    method?: PaymentMethod;
}

export interface ConfirmTossPaymentRequest {
    paymentKey: string;
    orderId: string;
    amount: number;
}

export interface FailTossPaymentRequest {
    orderId: string;
    code?: string;
    message?: string;
}

/**
 * 결제용 주문 항목 입력 (배달/포장 주문용)
 */
export interface PaymentOrderItemInput {
    menuId: string;
    menuName: string;
    quantity: number;
    price: number;
    options: {
        optionId?: string;
        name: string;
        price: number;
    }[];
}

export interface DeliveryOrderAddressInput {
    recipientName: string;
    recipientPhone: string;
    address: string;
    detailAddress?: string;
    zipCode?: string;
    deliveryMemo?: string;
    addressId?: string;
}

/**
 * 배달/포장 주문 생성 요청 (결제 포함)
 */
export interface CreateDeliveryOrderRequest {
    storeId: string;
    tableId?: string; // 선택적 (배달은 없음)
    userId?: string;
    delivery: DeliveryOrderAddressInput;
    items: PaymentOrderItemInput[];
    totalAmount: number;
    payment: PaymentRequest;
}

/**
 * 주문 생성 응답 (결제 포함)
 */
export interface PaymentOrderResponse {
    id: string;
    orderNumber: string;
    status: 'PENDING' | 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'COOKING' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
    totalAmount: number;
    createdAt: string;
}

// 레거시 호환용 alias
/** @deprecated PaymentOrderItemInput 사용 권장 */
export type OrderItemInput = PaymentOrderItemInput;
/** @deprecated PaymentOrderResponse 사용 권장 */
export type OrderResponse = PaymentOrderResponse;
