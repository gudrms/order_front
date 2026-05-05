'use client';

import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging, isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** 현재 등록된 웹 푸시 토큰 (모듈 수준 캐시) */
let _currentToken: string | null = null;

export function getCurrentWebPushToken(): string | null {
  return _currentToken;
}

async function registerToken(token: string, accessToken: string) {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is required to register web push tokens');
  }

  await axios.post(
    `${API_URL}/devices`,
    { fcmToken: token, deviceType: 'ADMIN_WEB' },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

async function unregisterToken(token: string, accessToken: string) {
  if (!API_URL) return;

  await axios.delete(`${API_URL}/devices/${encodeURIComponent(token)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Firebase 웹 푸시 초기화 훅.
 * - 알림 권한 요청
 * - FCM 토큰 획득 → 백엔드 등록
 * - 포그라운드 메시지 수신 → Notification API
 * - 컴포넌트 언마운트 / 로그아웃 시 정리
 */
export function useWebPush() {
  const { user, session } = useAuth();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !session) return;
    if (!isFirebaseConfigured()) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    let cancelled = false;
    let unsubscribeForeground: (() => void) | undefined;
    const capturedAccessToken = session.access_token;

    async function init() {
      try {
        // 알림 권한 요청 (이미 허용된 경우 즉시 반환)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted' || cancelled) return;

        // FCM 전용 Service Worker 등록 (API Route → 환경변수 주입)
        const swReg = await navigator.serviceWorker.register('/api/firebase-sw', {
          scope: '/',
          updateViaCache: 'none',
        });
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        // FCM 토큰 획득
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (!token || cancelled) return;

        // 이미 동일 토큰 등록되어 있으면 skip
        if (registeredTokenRef.current === token) {
          _currentToken = token;
          return;
        }

        await registerToken(token, capturedAccessToken);
        registeredTokenRef.current = token;
        _currentToken = token;

        // 포그라운드 메시지 수신 → Notification API
        unsubscribeForeground = onMessage(messaging, (payload) => {
          const { title, body } = payload.notification ?? {};
          if (title && Notification.permission === 'granted') {
            new Notification(title, {
              body: body ?? '',
              icon: '/icon-192x192.png',
              data: payload.data,
              tag: payload.data?.tag || 'taco-admin',
            });
          }
        });
      } catch (err) {
        console.error('[useWebPush] init failed:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      unsubscribeForeground?.();
    };
  }, [user?.id, session?.access_token]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * 로그아웃 시 호출: 백엔드에서 토큰 제거 + 모듈 캐시 초기화.
 * AuthContext의 signOut() 에서 호출.
 */
export async function unregisterWebPush(accessToken: string): Promise<void> {
  if (!_currentToken) return;
  try {
    await unregisterToken(_currentToken, accessToken);
  } catch {
    // silent — 로그아웃 자체는 진행
  } finally {
    _currentToken = null;
  }
}
