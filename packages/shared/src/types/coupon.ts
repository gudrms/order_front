export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Coupon {
    id: string;
    code?: string | null;
    name: string;
    description?: string | null;
    type: CouponType;
    discountValue: number;
    maxDiscountAmount?: number | null;
    minOrderAmount?: number | null;
    isActive: boolean;
    defaultExpiryDays: number;
    createdAt: string;
}

export interface UserCoupon {
    id: string;
    userId: string;
    couponId: string;
    isUsed: boolean;
    usedAt?: string | null;
    expiresAt: string;
    createdAt: string;
    coupon: Coupon;
}

export interface RedeemCouponRequest {
    code: string;
}

/**
 * 주문 금액 기준으로 쿠폰 할인액을 클라이언트에서 계산한다.
 * 백엔드 validateAndCalculateDiscount 와 동일한 로직.
 */
export function calculateCouponDiscount(coupon: Coupon, orderAmount: number): number {
    if (coupon.type === 'PERCENTAGE') {
        const raw = Math.floor((orderAmount * coupon.discountValue) / 100);
        return coupon.maxDiscountAmount != null ? Math.min(raw, coupon.maxDiscountAmount) : raw;
    }
    return Math.min(coupon.discountValue, orderAmount);
}
