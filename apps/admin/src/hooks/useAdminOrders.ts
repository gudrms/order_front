import { useQuery } from '@tanstack/react-query';
import type { Order } from '@order/shared';
// api 헬퍼는 다른 앱과 같이 하위 경로로 불러온다
// (shared/src에 남은 예전 컴파일 index.js에는 api 내보내기가 없어 webpack에서 undefined가 된다)
import { mapOrder, type BackendOrder } from '@order/shared/api';
import { adminApi } from '@/lib/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore } from '@/contexts/AdminStoreContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 선택한 매장의 주문 목록. 주문 관리 화면과 새 주문 알람이 같은 캐시를 쓴다.
 * @param refetchIntervalMs 실시간 구독이 끊겨도 새 주문을 놓치지 않도록 주기적으로 다시 확인할 때 사용
 */
export function useAdminOrders(options: { refetchIntervalMs?: number } = {}) {
  const { session } = useAuth();
  const { selectedStoreId: storeId, authHeaders } = useAdminStore();

  return useQuery<Order[]>({
    queryKey: ['admin-orders', storeId],
    queryFn: async () => {
      const response = await adminApi.get(`${API_URL}/stores/${storeId}/orders`, {
        headers: authHeaders,
      });
      // 페이지네이션 응답: { data: [...], meta: {...} } → data 배열만 추출
      // 백엔드 원본(menuPrice, selectedOptions)을 화면용 Order(unitPrice, options)로 변환한다
      const rows: BackendOrder[] = response.data?.data ?? response.data ?? [];
      return rows.map(mapOrder);
    },
    enabled: !!session && !!storeId,
    refetchInterval: options.refetchIntervalMs,
    // 백그라운드(PC 앱 트레이)에서도 주기 확인을 멈추지 않는다
    refetchIntervalInBackground: !!options.refetchIntervalMs,
  });
}

/** 결제는 끝났는데 매장이 아직 접수하지 않은 주문 — 접수하거나 취소할 때까지 알람이 울린다 */
export function isAwaitingAcceptance(order: Order) {
  return order.status === 'PAID' || order.status === 'PENDING';
}
