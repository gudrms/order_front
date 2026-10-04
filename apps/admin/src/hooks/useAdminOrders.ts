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
export type OrderStateFilter = 'all' | 'active' | 'cancelled' | 'completed';

export function useAdminOrderList(filters: { startDate: string; endDate: string; state: OrderStateFilter; page: number }) {
  const { session } = useAuth();
  const { selectedStoreId: storeId, authHeaders } = useAdminStore();
  return useQuery({
    queryKey: ['admin-orders', storeId, 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.state !== 'all') params.set('state', filters.state);
      if (filters.page > 1) params.set('page', String(filters.page));
      const query = params.toString();
      const response = await adminApi.get(`${API_URL}/stores/${storeId}/orders${query ? `?${query}` : ''}`, { headers: authHeaders });
      const rows: BackendOrder[] = response.data?.data ?? response.data ?? [];
      const orders = rows.map(mapOrder);
      const meta = response.data?.meta;
      return {
        orders,
        total: (meta?.total ?? orders.length) as number,
        lastPage: (meta?.lastPage ?? 1) as number,
        counts: (meta?.counts ?? {
          all: orders.length,
          active: orders.filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status)).length,
          cancelled: orders.filter((order) => order.status === 'CANCELLED').length,
          completed: orders.filter((order) => order.status === 'COMPLETED').length,
        }) as Record<OrderStateFilter, number>,
      };
    },
    enabled: !!session && !!storeId && !(filters.startDate && filters.endDate && filters.startDate > filters.endDate),
  });
}

/** Alarm query is independent of the order page's date/status/page filters. */
export function usePendingAdminOrders(enabled: boolean) {
  const { selectedStoreId: storeId, authHeaders } = useAdminStore();
  return useQuery<Order[]>({
    queryKey: ['admin-orders', storeId, 'awaiting-acceptance'],
    queryFn: async () => {
      const groups = await Promise.all(['PAID', 'PENDING'].map(async (status) => {
        const rows: BackendOrder[] = [];
        let page = 1;
        let lastPage = 1;
        do {
          const response = await adminApi.get(`${API_URL}/stores/${storeId}/orders?status=${status}&page=${page}`, { headers: authHeaders });
          rows.push(...(response.data?.data ?? response.data ?? []));
          lastPage = response.data?.meta?.lastPage ?? 1;
          page += 1;
        } while (page <= lastPage);
        return rows.map(mapOrder);
      }));
      return [...new Map(groups.flat().filter(isAwaitingAcceptance).map((order) => [order.id, order])).values()];
    },
    enabled: enabled && !!storeId && !!authHeaders,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
