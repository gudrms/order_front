'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useOrderStatusAlerts } from '@/hooks/useOrderStatusAlerts';

/**
 * FCM 푸시 알림 리스너를 앱 최상단에 등록.
 * AuthProvider 하위에 있어야 useAuth() 가 동작하므로 Providers 내부에서 마운트.
 * 네이티브가 아닌 환경(웹 브라우저)에서는 푸시는 동작하지 않고, 주문 상태 변경 토스트만 띄운다.
 */
export default function PushNotificationHandler() {
    usePushNotifications();
    useOrderStatusAlerts();
    return null;
}
