import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@order/shared/api';
import type { RedeemCouponRequest } from '@order/shared';

export const couponQueryKey = ['coupons'];

export function useAvailableCoupons(userId?: string | null) {
    return useQuery({
        queryKey: [...couponQueryKey, 'available', userId],
        queryFn: () => api.coupon.getAvailableCoupons(),
        enabled: !!userId,
        staleTime: 60_000,
    });
}

export function useMyCoupons(userId?: string | null) {
    return useQuery({
        queryKey: [...couponQueryKey, 'all', userId],
        queryFn: () => api.coupon.getMyCoupons(),
        enabled: !!userId,
        staleTime: 60_000,
    });
}

export function useRedeemCoupon(userId?: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: RedeemCouponRequest) => api.coupon.redeemCoupon(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: couponQueryKey });
        },
    });
}
