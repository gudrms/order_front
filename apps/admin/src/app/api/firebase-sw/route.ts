import { NextResponse } from 'next/server';

/**
 * Firebase Messaging Service Worker를 동적으로 제공합니다.
 * public/ 디렉터리의 정적 파일은 NEXT_PUBLIC_* 환경변수에 접근할 수 없으므로
 * API Route를 통해 환경변수를 주입한 SW 스크립트를 반환합니다.
 *
 * 등록 URL: /api/firebase-sw
 * 범위(scope): /  (Service-Worker-Allowed: / 헤더로 허용)
 */
export async function GET() {
  const config = JSON.stringify({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  });

  const content = `
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

var _config = ${config};

if (_config.apiKey && _config.projectId) {
  firebase.initializeApp(_config);
  var messaging = firebase.messaging();

  // 백그라운드 메시지 수신 → 브라우저 알림 표시
  messaging.onBackgroundMessage(function(payload) {
    var n = payload.notification || {};
    var data = payload.data || {};
    self.registration.showNotification(n.title || '새 알림', {
      body: n.body || '',
      icon: n.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: data,
      tag: data.tag || 'taco-admin',
    });
  });

  // 알림 클릭 → URL 이동
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    var url = (event.notification.data || {}).url;
    if (url) {
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
          for (var i = 0; i < list.length; i++) {
            if (list[i].url === url && 'focus' in list[i]) {
              return list[i].focus();
            }
          }
          if (clients.openWindow) return clients.openWindow(url);
        })
      );
    }
  });
}
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
