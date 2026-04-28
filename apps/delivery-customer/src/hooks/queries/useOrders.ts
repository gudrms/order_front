import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@order/shared';

export function useOrders(params: {
    storeId?: string | null;
    userId?: string | null;
}) {
    return useQuery({
        queryKey: ['delivery-orders', params.storeId, params.userId],
        queryFn: () => api.order.getDeliveryOrders({ storeId: params.storeId }),
        enabled: !!params.storeId && !!params.userId,
    });
}

export function useOrder(orderId?: string | null, userId?: string | null) {
    return useQuery({
        queryKey: ['delivery-order', orderId, userId],
        queryFn: () => api.order.getOrder(orderId!),
        enabled: !!orderId && !!userId,
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
