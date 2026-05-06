import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { emitAdminOrderAlert } from '@/lib/adminOrderAlerts';

/**
 * 실시간 주문 알림 훅
 * @param storeId 매장 ID (해당 매장의 주문만 구독)
 */
export function useRealtimeOrders(storeId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!storeId) return;

    // 채널 생성 및 구독
    const channel = supabase
      .channel(`orders:${storeId}`) // 채널명은 유니크하게
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모든 이벤트 감지
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`, // ⭐️ 내 매장 주문만 필터링
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const order = payload.new as {
              id?: string;
              order_number?: string;
              total_amount?: number;
            };
            emitAdminOrderAlert({
              storeId,
              orderId: order.id,
              orderNumber: order.order_number,
              totalAmount: order.total_amount,
            });
          }

          queryClient.invalidateQueries({ queryKey: ['admin-orders', storeId] });
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);
}
