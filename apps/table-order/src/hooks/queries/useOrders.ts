import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/api/endpoints/order';

export function useOrdersByTable(tableNumber?: number, storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['orders', 'table', storeId, tableNumber];

  const query = useQuery({
    queryKey,
    queryFn: () => api.order.getOrdersByTable(tableNumber!, storeId!),
    enabled: !!tableNumber && !!storeId,
  });

  // 첫 조회 후 sessionId를 알게 되면 정확한 필터로 재구독
  const sessionId = query.data?.sessionId ?? null;

  useEffect(() => {
    if (!tableNumber || !storeId) return;

    // sessionId 확정 전엔 storeId로 폴백, 확정 후엔 정확한 세션만 구독
    const filter = sessionId
      ? `sessionId=eq.${sessionId}`
      : `storeId=eq.${storeId}`;

    const channel = supabase
      .channel(`orders:${storeId}:${tableNumber}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order', filter },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableNumber, storeId, sessionId, queryClient]);

  return {
    ...query,
    data: query.data?.orders as Order[] | undefined,
  };
}
