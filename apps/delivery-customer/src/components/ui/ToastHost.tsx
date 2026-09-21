'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
    dismissWebToast,
    getWebToast,
    getWebToastServerSnapshot,
    subscribeWebToast,
} from '@/lib/webToast';

/**
 * 웹 토스트 출력부. 네이티브에서는 Capacitor Toast가 뜨므로 여기로 오지 않는다.
 * (`lib/capacitor/toast.ts` 참고)
 */
export default function ToastHost() {
    const toast = useSyncExternalStore(subscribeWebToast, getWebToast, getWebToastServerSnapshot);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => dismissWebToast(toast.id), toast.durationMs);
        return () => clearTimeout(timer);
    }, [toast]);

    if (!toast) return null;

    return (
        <div
            // 하단 고정 버튼(주문하기·결제하기)을 가리지 않도록 그 위에 띄운다.
            className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
        >
            <p
                role="status"
                aria-live="polite"
                className="max-w-[568px] rounded-xl bg-black/85 px-4 py-3 text-sm text-white shadow-lg"
            >
                {toast.message}
            </p>
        </div>
    );
}
