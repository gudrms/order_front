'use client';

import { useDeepLink } from '@/hooks/useDeepLink';

/**
 * Capacitor 딥링크 리스너를 앱 최상단에 등록.
 * 네이티브가 아닌 환경에서는 아무 동작도 하지 않는다.
 */
export default function DeepLinkHandler() {
    useDeepLink();
    return null;
}
