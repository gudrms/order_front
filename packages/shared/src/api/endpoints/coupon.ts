import type { UserCoupon, RedeemCouponRequest } from '../../types';
import { apiClient } from '../client';

/** 사용 가능한 내 쿠폰 (미사용 + 미만료) */
export async function getAvailableCoupons(): Promise<UserCoupon[]> {
    return apiClient.get<UserCoupon[]>('/users/me/coupons/available');
}

/** 전체 내 쿠폰 (사용/만료 포함) */
export async function getMyCoupons(): Promise<UserCoupon[]> {
    return apiClient.get<UserCoupon[]>('/users/me/coupons');
}

/** 프로모 코드 등록 */
export async function redeemCoupon(request: RedeemCouponRequest): Promise<UserCoupon> {
    return apiClient.post<UserCoupon>('/users/me/coupons/redeem', request);
}
