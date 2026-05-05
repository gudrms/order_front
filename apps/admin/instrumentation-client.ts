import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
  release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event, hint) {
    if (!event.tags) event.tags = {};
    event.tags.app = 'admin';

    if (event.request) {
      delete event.request.cookies;
    }

    const originalException = hint.originalException;
    if (originalException instanceof Error && originalException.message.includes('NetworkError')) {
      return null;
    }

    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
