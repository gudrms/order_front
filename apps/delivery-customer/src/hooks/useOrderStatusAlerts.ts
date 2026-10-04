'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@order/shared/api';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentPushToken } from '@/lib/capacitor/push-notifications';
import { showToast } from '@/lib/capacitor/toast';
import { getCustomerOrderStatusLabel, toCustomerOrderStage, type CustomerOrderStage } from '@/lib/orderStatus';

const ACTIVE_STAGES: CustomerOrderStage[] = ['WAITING', 'COOKING', 'DELIVERING'];

/**
 * 앱을 보고 있는 동안 내 주문의 단계가 바뀌면 토스트로 알린다.
 * FCM 푸시가 없거나(설정 전·권한 거부) 웹으로 접속한 경우에도 상태 변경을 놓치지 않게 하는 용도.
 * 진행 중인 주문이 있을 때만 자주 확인한다.
 */
export function useOrderStatusAlerts() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const stagesRef = useRef(new Map<string, CustomerOrderStage>());

    const { data } = useQuery({
        queryKey: ['delivery-order-alerts', user?.id],
        queryFn: () => api.order.getDeliveryOrders({}),
        enabled: !!user,
        refetchInterval: (query) =>
            query.state.data?.orders.some((order) => ACTIVE_STAGES.includes(toCustomerOrderStage(order.status))) ? 10_000 : 60_000,
    });

    useEffect(() => {
        stagesRef.current.clear();
    }, [user?.id]);

    useEffect(() => {
        if (!data) return;
        const known = stagesRef.current;
        const isFirstLoad = known.size === 0;
        let changed = false;
        for (const order of data.orders) {
            const stage = toCustomerOrderStage(order.status);
            const previous = known.get(order.id);
            known.set(order.id, stage);
            if (isFirstLoad || !previous || previous === stage) continue;
            changed = true;
            // 네이티브 푸시가 등록돼 있으면 포그라운드 푸시가 로컬 알림으로 이미 뜨므로 겹치지 않게 한다
            if (!getCurrentPushToken()) {
                void showToast(`🌮 주문 ${order.orderNumber}: ${getCustomerOrderStatusLabel(order.status)}`, 'long');
            }
        }
        if (changed) void queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    }, [data, queryClient]);
}
