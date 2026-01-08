import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
          console.log('Realtime Order Update:', payload);

          // 1. 신규 주문(INSERT)일 때 알림음 재생 (선택 사항)
          if (payload.eventType === 'INSERT') {
            const audio = new Audio('/sounds/notification.mp3'); // public 폴더에 파일 필요
            audio.play().catch((e) => console.log('Audio play failed:', e));
          }

          // 2. 데이터가 변경되었으므로 React Query 캐시를 무효화하여 목록 새로고침
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
