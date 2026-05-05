'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * FCM 푸시 알림 리스너를 앱 최상단에 등록.
 * AuthProvider 하위에 있어야 useAuth() 가 동작하므로 Providers 내부에서 마운트.
 * 네이티브가 아닌 환경(웹 브라우저)에서는 아무 동작도 하지 않는다.
 */
export default function PushNotificationHandler() {
    usePushNotifications();
    return null;
}
