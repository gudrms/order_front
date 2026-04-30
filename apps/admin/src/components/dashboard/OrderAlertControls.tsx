'use client';

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Bell, BellOff, Volume2 } from 'lucide-react';
import { ADMIN_ORDER_ALERT_EVENT, type AdminOrderAlertPayload } from '@/lib/adminOrderAlerts';

const ALERT_ENABLED_KEY = 'admin.orderAlerts.enabled';
const SOUND_ENABLED_KEY = 'admin.orderAlerts.soundEnabled';

export function OrderAlertControls() {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [lastAlert, setLastAlert] = useState<AdminOrderAlertPayload | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setAlertsEnabled(localStorage.getItem(ALERT_ENABLED_KEY) === 'true');
    setSoundEnabled(localStorage.getItem(SOUND_ENABLED_KEY) === 'true');
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ALERT_ENABLED_KEY, String(alertsEnabled));
  }, [alertsEnabled]);

  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    const handleNewOrder = (event: Event) => {
      const payload = (event as CustomEvent<AdminOrderAlertPayload>).detail;
      setLastAlert(payload);

      if (soundEnabled) {
        playNotificationTone(audioContextRef);
      }

      if (alertsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('새 주문이 접수되었습니다', {
          body: payload.orderNumber ? `주문번호 ${payload.orderNumber}` : '관리자 주문 목록을 확인하세요.',
          tag: payload.orderId || `store-${payload.storeId}`,
        });
      }
    };

    window.addEventListener(ADMIN_ORDER_ALERT_EVENT, handleNewOrder);
    return () => window.removeEventListener(ADMIN_ORDER_ALERT_EVENT, handleNewOrder);
  }, [alertsEnabled, soundEnabled]);

  const notificationLabel = useMemo(() => {
    if (!alertsEnabled) return '알림 꺼짐';
    if (notificationPermission === 'granted') return '알림 켜짐';
    if (notificationPermission === 'denied') return '알림 차단됨';
    return '알림 권한 필요';
  }, [alertsEnabled, notificationPermission]);

  const enableNotifications = async () => {
    const nextSoundEnabled = !soundEnabled;
    setSoundEnabled(nextSoundEnabled);
    if (nextSoundEnabled) {
      playNotificationTone(audioContextRef);
    }

    if (!('Notification' in window)) {
      setAlertsEnabled(false);
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setAlertsEnabled(permission === 'granted');
      return;
    }

    setNotificationPermission(Notification.permission);
    setAlertsEnabled(Notification.permission === 'granted' ? !alertsEnabled : false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {lastAlert && (
        <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 lg:inline">
          최근 주문 {lastAlert.orderNumber || lastAlert.orderId || '-'}
        </span>
      )}
      <button
        type="button"
        onClick={enableNotifications}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
          alertsEnabled || soundEnabled
            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
        title="브라우저 알림 권한과 알림음을 설정합니다."
      >
        {alertsEnabled || soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        {notificationLabel}
        {soundEnabled && <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

function playNotificationTone(audioContextRef: MutableRefObject<AudioContext | null>) {
  if (typeof window === 'undefined') return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = audioContextRef.current || new AudioContextClass();
  audioContextRef.current = context;

  if (context.state === 'suspended') {
    void context.resume();
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.36);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
