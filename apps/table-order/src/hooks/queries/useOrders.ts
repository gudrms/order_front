import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/api/endpoints/order';

export function useOrdersByTable(tableNumber?: number, storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['orders', 'table', storeId, tableNumber];

  useEffect(() => {
    if (!tableNumber || !storeId) return;

    const channel = supabase
      .channel(`orders:${storeId}:${tableNumber}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order', filter: `storeId=eq.${storeId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', 'table', storeId, tableNumber] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableNumber, storeId, queryClient]);

  return useQuery<Order[]>({
    queryKey,
    queryFn: () => api.order.getOrdersByTable(tableNumber!, storeId!),
    enabled: !!tableNumber && !!storeId,
  });
}
