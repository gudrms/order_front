import type { FullConfig } from '@playwright/test';
import { startStubBackend } from './utils/stub-backend';

/**
 * Playwright globalSetup
 *
 * 테이블오더 layout 의 SSR fetch 가 닿을 stub backend 를 띄운다.
 * 포트 충돌(이미 backend 가 떠 있음) 시에는 기존 서버를 신뢰하고 통과.
 */
export default async function globalSetup(_config: FullConfig) {
  try {
    const server = await startStubBackend(4000);
    // teardown 에서 사용
    (globalThis as Record<string, unknown>).__stubBackend = server;
    // eslint-disable-next-line no-console
    console.log('[stub-backend] listening on http://127.0.0.1:4000');
  } catch (err) {
    // EADDRINUSE 등으로 시작 실패 시: 기존 backend 가 있다고 가정하고 진행
    if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.warn('[stub-backend] port 4000 already in use — skipping stub');
      return;
    }
    throw err;
  }
}
