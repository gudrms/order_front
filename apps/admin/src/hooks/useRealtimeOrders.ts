import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * 실시간 주문 구독 — 주문이 생기거나 바뀌면 주문 목록을 다시 불러온다.
 * 알람(소리·배너)은 목록의 "결제 완료·미접수" 주문을 보고 PendingOrderAlarm이 결정한다.
 * @param storeId 매장 ID (해당 매장의 주문만 구독)
 */
export function useRealtimeOrders(storeId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`orders:${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          // Prisma 모델명·컬럼명 그대로 (예전엔 'orders'/'store_id'로 구독해 이벤트가 한 번도 오지 않았다)
          table: 'Order',
          filter: `storeId=eq.${storeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-orders', storeId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);
}
