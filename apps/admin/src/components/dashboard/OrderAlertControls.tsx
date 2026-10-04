'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellOff, Volume2 } from 'lucide-react';
import { isAdminElectronRuntime } from '@/lib/electronBridge';
import { ALERT_ENABLED_KEY, playOrderAlarmTone, SOUND_ENABLED_KEY } from '@/lib/orderAlarmSound';

/** 알림·알림음 켜고 끄기. 실제 알람은 PendingOrderAlarm이 이 설정을 읽어 울린다 */

export function OrderAlertControls() {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const audioContextRef = useRef<AudioContext | null>(null);
  const isElectron = isAdminElectronRuntime();

  useEffect(() => {
    // 주문을 놓치지 않도록 기본은 켜짐. 사용자가 직접 끈 경우('false' 저장)만 꺼진 채로 둔다
    setAlertsEnabled(localStorage.getItem(ALERT_ENABLED_KEY) !== 'false');
    setSoundEnabled(localStorage.getItem(SOUND_ENABLED_KEY) !== 'false');
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // 로그인 시 useWebPush가 권한을 요청하므로, 허용/차단 결과를 라벨에 반영한다
    let status: PermissionStatus | null = null;
    const syncPermission = () => {
      if ('Notification' in window) setNotificationPermission(Notification.permission);
    };
    navigator.permissions?.query({ name: 'notifications' })
      .then((result) => {
        status = result;
        status.addEventListener('change', syncPermission);
      })
      .catch(() => {});
    return () => status?.removeEventListener('change', syncPermission);
  }, []);

  useEffect(() => {
    localStorage.setItem(ALERT_ENABLED_KEY, String(alertsEnabled));
  }, [alertsEnabled]);

  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled));
  }, [soundEnabled]);


  const notificationLabel = useMemo(() => {
    if (isElectron && alertsEnabled) return 'PC 알림 켜짐';
    if (!alertsEnabled) return '알림 꺼짐';
    if (notificationPermission === 'granted') return '알림 켜짐';
    if (notificationPermission === 'denied') return '알림 차단됨';
    return '알림 권한 필요';
  }, [alertsEnabled, notificationPermission]);

  const enableNotifications = async () => {
    // 기본이 켜짐이라, 권한을 아직 안 받은 상태("알림 권한 필요")에서 누르면 끄지 말고 권한부터 받는다
    if (!isElectron && 'Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setAlertsEnabled(permission === 'granted');
      setSoundEnabled(true);
      playOrderAlarmTone(audioContextRef);
      return;
    }

    const nextSoundEnabled = !soundEnabled;
    setSoundEnabled(nextSoundEnabled);
    if (nextSoundEnabled) {
      playOrderAlarmTone(audioContextRef);
    }

    if (isElectron) {
      setAlertsEnabled(!alertsEnabled);
      return;
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
      <button
        type="button"
        onClick={enableNotifications}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
          alertsEnabled || soundEnabled
            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
        title={isElectron ? 'PC 앱 알림과 알림음을 설정합니다.' : '브라우저 알림 권한과 알림음을 설정합니다.'}
      >
        {alertsEnabled || soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        {notificationLabel}
        {soundEnabled && <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

