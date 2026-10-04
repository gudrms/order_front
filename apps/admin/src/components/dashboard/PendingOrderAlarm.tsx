'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BellRing } from 'lucide-react';
import { useAdminStore } from '@/contexts/AdminStoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessAdmin } from '@/lib/adminPermissions';
import { usePendingAdminOrders } from '@/hooks/useAdminOrders';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { getAdminElectronBridge } from '@/lib/electronBridge';
import { ALERT_ENABLED_KEY, ORDER_ALERT_SETTINGS_EVENT, playOrderAlarmVoice, stopOrderAlarmVoice, SOUND_ENABLED_KEY } from '@/lib/orderAlarmSound';

const OrderAlarmContext = createContext({ count: 0, soundBlocked: false, soundEnabled: true, isError: false });

/** Root provider owns monitoring so navigation or dashboard loading never stops the alarm. */
export function OrderAlarmProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const { selectedStoreId } = useAdminStore();
  const enabled = !!user && canAccessAdmin(profile);
  useRealtimeOrders(enabled ? selectedStoreId || '' : '');
  const { data: orders = [], isError } = usePendingAdminOrders(enabled);
  const pending = enabled ? orders : [];
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [settings, setSettings] = useState({ alerts: true, sound: true });
  const notifiedIdsRef = useRef(new Set<string>());
  const notifyingIdsRef = useRef(new Set<string>());
  const hasPending = pending.length > 0;

  useEffect(() => {
    const sync = () => { setSettings({ alerts: localStorage.getItem(ALERT_ENABLED_KEY) !== 'false', sound: localStorage.getItem(SOUND_ENABLED_KEY) !== 'false' }); setSettingsReady(true); };
    sync();
    window.addEventListener(ORDER_ALERT_SETTINGS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ORDER_ALERT_SETTINGS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) { notifiedIdsRef.current.clear(); return; }
    if (!settingsReady || !settings.alerts) return;
    for (const order of pending) {
      if (notifiedIdsRef.current.has(order.id) || notifyingIdsRef.current.has(order.id)) continue;
      const bridge = getAdminElectronBridge();
      const payload = { storeId: order.storeId, orderId: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount };
      if (bridge?.notifyNewOrder) {
        notifyingIdsRef.current.add(order.id);
        Promise.resolve().then(() => bridge.notifyNewOrder?.(payload)).then(() => notifiedIdsRef.current.add(order.id)).catch((error) => console.error('PC 주문 알림 실패', error)).finally(() => notifyingIdsRef.current.delete(order.id));
      } else if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('접수 대기 중입니다', { body: `주문번호 ${order.orderNumber} · 접수하거나 취소해 주세요.`, tag: order.id, requireInteraction: true, silent: true });
          notifiedIdsRef.current.add(order.id);
        } catch (error) { console.error('주문 알림 실패', error); }
      }
    }
  }, [pending, settings.alerts, enabled, settingsReady]);

  useEffect(() => {
    if (!settingsReady || !hasPending || !settings.sound) {
      stopOrderAlarmVoice();
      setSoundBlocked(false);
      return;
    }
    let active = true;
    const ring = async () => {
      const played = await playOrderAlarmVoice();
      if (active) setSoundBlocked(!played);
    };
    void ring();
    const timer = window.setInterval(() => { void ring(); }, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
      stopOrderAlarmVoice();
    };
  }, [hasPending, settings.sound, settingsReady]);

  useEffect(() => {
    if (!hasPending || !settings.sound || !soundBlocked) return;
    let active = true;
    const unlock = async () => { const played = await playOrderAlarmVoice(); if (active) setSoundBlocked(!played); };
    window.addEventListener('pointerdown', unlock);
    return () => { active = false; window.removeEventListener('pointerdown', unlock); };
  }, [hasPending, settings.sound, soundBlocked]);

  return <OrderAlarmContext.Provider value={{ count: pending.length, soundBlocked, soundEnabled: settings.sound, isError: enabled && isError }}>{children}</OrderAlarmContext.Provider>;
}

export function PendingOrderAlarm() {
  const router = useRouter();
  const pathname = usePathname();
  const { count, soundBlocked, soundEnabled, isError } = useContext(OrderAlarmContext);
  if (!count) return isError ? <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">주문 알림 조회에 실패했습니다. 연결 상태를 확인해 주세요. 자동으로 다시 확인합니다.</p> : null;
  return (
    <div className="sticky top-14 z-20 mb-3 flex flex-wrap md:top-0 items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700 xl:mb-6 xl:px-4 xl:py-3" role="alert" data-testid="admin-pending-order-alarm">
      <div className="flex min-w-0 items-center gap-3">
        <BellRing className="h-5 w-5 shrink-0 motion-safe:animate-bounce" />
        <div>
          <p className="font-bold">접수 대기 주문 {count}건</p>
          <p className="text-sm">{!soundEnabled ? '음성 알림이 꺼져 있습니다. 상단 알림 버튼에서 켤 수 있습니다.' : soundBlocked ? '음성 재생이 차단됐습니다. 화면을 클릭하면 다시 재생합니다.' : '접수하거나 취소할 때까지 “접수 대기 중입니다” 음성이 반복됩니다.'}</p>
          {isError && <p className="text-sm">연결 오류로 마지막 확인된 주문을 표시합니다. 자동으로 다시 확인합니다.</p>}
        </div>
      </div>
      {pathname !== '/orders' && <button type="button" onClick={() => router.push('/orders')} className="min-h-11 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">주문 보기</button>}
    </div>
  );
}
