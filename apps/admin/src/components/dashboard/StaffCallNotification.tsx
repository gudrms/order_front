'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { STAFF_CALL_EVENT, type StaffCall } from '@/hooks/useStaffCalls';

const CALL_TYPE_LABEL: Record<string, string> = {
    water: '물',
    spoon: '수저',
    tissue: '티슈',
    bill: '계산',
    other: '기타',
};

interface ToastItem {
    id: string;
    tableNumber: number;
    callType: string | null;
    at: number;
}

/**
 * 새 직원 호출 수신 시 우측 상단에 토스트 알림 표시.
 * 알림음은 OrderAlertControls의 playNotificationTone 동일 패턴(Web AudioContext) 사용.
 * DashboardLayout 에서 한 번만 마운트.
 */
export function StaffCallNotification() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const dismiss = (id: string) =>
        setToasts((prev) => prev.filter((t) => t.id !== id));

    const playTone = () => {
        if (typeof window === 'undefined') return;
        const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        const ctx = audioCtxRef.current ?? new Ctx();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') void ctx.resume();

        // 두 번 울리는 알림음 (직원 호출용)
        [0, 0.4].forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(660, ctx.currentTime + offset);
            gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.31);
        });
    };

    useEffect(() => {
        const handler = (e: Event) => {
            const call = (e as CustomEvent<Partial<StaffCall>>).detail;
            const toast: ToastItem = {
                id: call.id ?? String(Date.now()),
                tableNumber: call.tableNumber ?? 0,
                callType: call.callType ?? null,
                at: Date.now(),
            };
            setToasts((prev) => [...prev.slice(-4), toast]); // 최대 5개 유지
            playTone();

            // 8초 후 자동 닫기
            setTimeout(() => dismiss(toast.id), 8000);
        };

        window.addEventListener(STAFF_CALL_EVENT, handler);
        return () => window.removeEventListener(STAFF_CALL_EVENT, handler);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="pointer-events-auto flex items-center gap-3 rounded-xl bg-orange-500 px-4 py-3 text-white shadow-lg animate-in slide-in-from-right"
                >
                    <Bell className="w-5 h-5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-bold">직원 호출</p>
                        <p className="text-xs opacity-90">
                            {toast.tableNumber}번 테이블
                            {toast.callType
                                ? ` — ${CALL_TYPE_LABEL[toast.callType] ?? toast.callType}`
                                : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => dismiss(toast.id)}
                        className="shrink-0 rounded-full p-0.5 hover:bg-orange-600 transition-colors"
                        aria-label="닫기"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
