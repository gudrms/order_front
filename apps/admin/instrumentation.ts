export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry 초기화
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge Runtime Sentry 초기화
    await import('./sentry.edge.config');
  }
}
