export async function register() {
  // Client-side Sentry 초기화
  await import('./sentry.client.config');
}
