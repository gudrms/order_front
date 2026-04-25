import { useQuery } from '@tanstack/react-query';
import { api } from '@order/shared';

export function useOrders(params: {
    storeId?: string | null;
    phone?: string | null;
    userId?: string | null;
}) {
    return useQuery({
        queryKey: ['delivery-orders', params.storeId, params.phone, params.userId],
        queryFn: () => api.order.getDeliveryOrders(params),
        enabled: !!params.storeId && (!!params.phone || !!params.userId),
    });
}

export function useOrder(orderId?: string | null) {
    return useQuery({
        queryKey: ['delivery-order', orderId],
        queryFn: () => api.order.getOrder(orderId!),
        enabled: !!orderId,
    });
}
