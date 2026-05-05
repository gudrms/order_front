'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isNative } from '@/lib/capacitor';
import {
    initPushNotifications,
    addPushNavigateListener,
    getCurrentPushToken,
    getPushDeviceType,
} from '@/lib/capacitor/push-notifications';
import { api } from '@order/shared';

/**
 * FCM 푸시 알림 초기화 훅.
 *
 * - 앱 최초 마운트 시 권한 요청 + 등록
 * - 토큰 수신 → POST /devices (로그인 상태일 때만)
 * - 로그인 후 기존 토큰 재등록 (권한 이미 허용된 경우 대비)
 * - 알림 탭 → router.push() 로 해당 페이지 이동
 *
 * AppLayout 또는 Providers 내부에서 한 번만 마운트한다.
 */
export function usePushNotifications() {
    const { user } = useAuth();
    const router = useRouter();
    const registeredTokenRef = useRef<string | null>(null);

    const registerTokenToServer = async (token: string) => {
        if (!user) return; // 비로그인 상태면 스킵
        if (registeredTokenRef.current === token) return; // 이미 등록된 토큰

        try {
            await api.devices.registerDevice({
                fcmToken: token,
                deviceType: getPushDeviceType(),
            });
            registeredTokenRef.current = token;
        } catch (err) {
            // 401(미로그인) 또는 네트워크 오류 → 조용히 무시
            // 로그인 후 재시도됨
            console.warn('[Push] 토큰 백엔드 등록 실패 (재시도 예정):', err);
        }
    };

    // ── 최초 마운트: 푸시 초기화 + 탭 네비게이션 리스너 ──────────────────
    useEffect(() => {
        if (!isNative) return;

        // 탭 네비게이션 이벤트 → 라우터 이동
        const removePushNav = addPushNavigateListener((path) => {
            router.push(path);
        });

        // 푸시 초기화 (비동기, 권한 요청 + register)
        // 토큰이 오면 registerTokenToServer 호출 — user 상태는 클로저로 참조
        void initPushNotifications((token) => {
            void registerTokenToServer(token);
        });

        return () => {
            removePushNav();
        };
        // router 는 안정적이므로 deps 제외 (Next.js 권장)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── 로그인 완료 후: 이미 발급된 토큰 재등록 시도 ──────────────────────
    // (권한 허용 후 앱 시작 → 토큰 먼저 옴 → 아직 비로그인 → 로그인 완료 → 여기서 재시도)
    useEffect(() => {
        if (!user || !isNative) return;
        const token = getCurrentPushToken();
        if (token) {
            void registerTokenToServer(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);
}
