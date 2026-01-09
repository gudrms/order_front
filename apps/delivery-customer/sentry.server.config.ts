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

  // PII (개인식별정보) 필터링
  beforeSend(event) {
    // 민감정보 제거
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
    }

    return event;
  },
});
