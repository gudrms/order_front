'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BellRing } from 'lucide-react';
import { useAdminStore } from '@/contexts/AdminStoreContext';
import { useAdminOrders, isAwaitingAcceptance } from '@/hooks/useAdminOrders';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { getAdminElectronBridge } from '@/lib/electronBridge';
import { ALERT_ENABLED_KEY, playOrderAlarmTone, SOUND_ENABLED_KEY } from '@/lib/orderAlarmSound';

const RING_INTERVAL_MS = 4000;
// 실시간 구독이 끊겨도 새 주문을 놓치지 않도록 주기적으로 다시 확인한다
const FALLBACK_REFETCH_MS = 15000;

/**
 * 새 주문 알람 — 결제가 끝났는데 아직 접수하지 않은 주문이 있으면
 * 접수하거나 취소할 때까지 알림음을 반복하고, 어느 화면에서든 상단 배너로 알린다.
 * 대시보드 레이아웃에 한 번만 둔다.
 */
export function PendingOrderAlarm() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedStoreId } = useAdminStore();
  useRealtimeOrders(selectedStoreId || '');
  const { data: orders = [] } = useAdminOrders({ refetchIntervalMs: FALLBACK_REFETCH_MS });

  const pending = orders.filter(isAwaitingAcceptance);
  const pendingKey = pending.map((order) => order.id).join(',');
  const hasPending = pending.length > 0;

  const audioContextRef = useRef<AudioContext | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const [soundBlocked, setSoundBlocked] = useState(false);

  // 새로 들어온 미접수 주문마다 한 번: PC 앱은 창을 앞으로 띄우고 알림, 브라우저는 데스크톱 알림
  useEffect(() => {
    for (const order of pending) {
      if (notifiedIdsRef.current.has(order.id)) continue;
      notifiedIdsRef.current.add(order.id);
      if (localStorage.getItem(ALERT_ENABLED_KEY) === 'false') continue;

      const payload = {
        storeId: order.storeId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      };
      const electronBridge = getAdminElectronBridge();
      if (electronBridge?.notifyNewOrder) {
        void electronBridge.notifyNewOrder(payload);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('새 주문이 들어왔습니다', {
          body: `주문번호 ${order.orderNumber} · 접수하거나 취소할 때까지 알림이 울립니다.`,
          tag: order.id,
          requireInteraction: true,
        });
      }
    }
  }, [pendingKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 미접수 주문이 남아 있는 동안 계속 울린다
  useEffect(() => {
    if (!hasPending) {
      setSoundBlocked(false);
      return;
    }
    const ring = () => {
      if (localStorage.getItem(SOUND_ENABLED_KEY) === 'false') return;
      setSoundBlocked(!playOrderAlarmTone(audioContextRef));
    };
    ring();
    const timer = setInterval(ring, RING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasPending]);

  // 브라우저가 소리를 막았으면 화면을 한 번 클릭하는 순간 다시 울린다
  useEffect(() => {
    if (!soundBlocked) return;
    const unlock = () => setSoundBlocked(!playOrderAlarmTone(audioContextRef));
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [soundBlocked]);

  if (!hasPending) return null;

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
      role="alert"
      data-testid="admin-pending-order-alarm"
    >
      <div className="flex min-w-0 items-center gap-3">
        <BellRing className="h-5 w-5 shrink-0 motion-safe:animate-bounce" />
        <div>
          <p className="font-bold">접수 대기 주문 {pending.length}건</p>
          <p className="text-sm">
            {soundBlocked
              ? '브라우저가 알림음을 막았습니다. 화면 아무 곳이나 한 번 클릭하면 소리가 납니다.'
              : '접수하거나 취소할 때까지 알림음이 울립니다.'}
          </p>
        </div>
      </div>
      {pathname !== '/orders' && (
        <button
          type="button"
          onClick={() => router.push('/orders')}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          주문 보기
        </button>
      )}
    </div>
  );
}
