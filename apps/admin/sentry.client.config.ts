import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 성능 모니터링 샘플링 (10% - 무료 플랜 고려)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 디버그 모드 (개발 환경에서만)
  debug: false,

  // 릴리즈 버전 추적
  release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',

  // Replay 샘플링 (세션 재생)
  replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100%
  replaysSessionSampleRate: 0.1, // 일반 세션 10%

  // Sentry integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // PII 보호
      blockAllMedia: true,
    }),
  ],

  // PII (개인식별정보) 필터링
  beforeSend(event, hint) {
    // 앱 태그 추가 (필터링용)
    if (!event.tags) event.tags = {};
    event.tags.app = 'admin';

    // 민감정보 제거
    if (event.request) {
      delete event.request.cookies;
    }

    // 특정 에러 무시 (예: 네트워크 에러)
    if (hint.originalException && typeof hint.originalException === 'object') {
      const error = hint.originalException as any;
      if (error.message?.includes('NetworkError')) {
        return null; // 이벤트 전송 안 함
      }
    }

    return event;
  },
});
