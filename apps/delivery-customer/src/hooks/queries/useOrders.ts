import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@order/shared/api';

export function useOrders(params: {
    storeId?: string | null;
    userId?: string | null;
}) {
    return useQuery({
        queryKey: ['delivery-orders', params.storeId, params.userId],
        queryFn: () => api.order.getDeliveryOrders({ storeId: params.storeId }),
        // 주문 내역은 로그인 사용자 기준으로 조회한다. 매장 선택은 선택적 필터일 뿐이라
        // storeId 없이도(홈 탭에서 진입) 조회되어야 한다.
        enabled: !!params.userId,
    });
}

export function useOrder(orderId?: string | null, userId?: string | null) {
    return useQuery({
        queryKey: ['delivery-order', orderId, userId],
        queryFn: () => api.order.getOrder(orderId!),
        enabled: !!orderId && !!userId,
        refetchInterval: userId ? 5000 : false,
    });
}

export function useCancelOrder(orderId?: string | null, userId?: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (reason?: string) => api.order.cancelOrder(orderId!, { reason }),
        onSuccess: (order) => {
            queryClient.setQueryData(['delivery-order', orderId, userId], order);
            queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
        },
    });
}
