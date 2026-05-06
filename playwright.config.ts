import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 설정
 *
 * 두 개의 프로젝트 실행:
 *  - admin      : Desktop Chrome, http://localhost:3003
 *  - delivery   : iPhone 14 (모바일 뷰), http://localhost:3001
 *
 * webServer 는 각 앱의 Next.js dev 서버를 자동 시작한다.
 *  - 로컬: reuseExistingServer=true → 이미 떠 있는 서버 재사용
 *  - CI:   reuseExistingServer=false → 항상 새로 기동
 *
 * Supabase / API env 는 Vercel 공유 환경변수 또는 GitHub Actions Secrets 에서 주입.
 * 미설정 시 placeholder 값으로 폴백 — 로그인 API 요청은 실패하지만
 * 페이지 구조·리다이렉트·공개 UI 검증은 정상 동작한다.
 */

const isCI = !!process.env.CI;

// 각 앱에 주입할 공통 환경변수 (미설정 시 placeholder 폴백)
function buildEnv(extra: Record<string, string> = {}) {
  return {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder',
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
    ...extra,
  };
}

export default defineConfig({
  testDir: './e2e',

  // 테이블오더 layout 의 SSR fetch 를 받을 stub backend 기동/정리
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  // 테스트 타임아웃
  timeout: 30_000,

  // CI: 실패 시 1회 재시도 / 로컬: 재시도 없음
  retries: isCI ? 1 : 0,

  // CI: 단일 워커 (리소스 안정성) / 로컬: 병렬 실행
  workers: isCI ? 1 : undefined,
  fullyParallel: !isCI,
  forbidOnly: isCI,

  reporter: isCI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // ── 관리자 웹 (Desktop) ──────────────────────────────────────────────
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3003',
      },
      testMatch: 'admin/**/*.spec.ts',
    },

    // ── 배달앱 고객 (Mobile) ─────────────────────────────────────────────
    {
      name: 'delivery',
      use: {
        ...devices['iPhone 14'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: 'delivery-customer/**/*.spec.ts',
    },

    // ── 테이블오더 (Tablet) ──────────────────────────────────────────────
    // 태블릿용 UI 지만 CI 의 chromium 만으로 실행하도록 Desktop Chrome +
    // 태블릿 viewport 조합. WebKit 기반 iPad 디바이스는 별도 브라우저 설치 필요.
    {
      name: 'table-order',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
        baseURL: 'http://localhost:3002',
      },
      testMatch: 'table-order/**/*.spec.ts',
    },
  ],

  webServer: [
    // ── Admin 개발 서버 ───────────────────────────────────────────────────
    // CI 의 cold cache 에서 next dev 첫 컴파일이 오래 걸려 timeout 을
    // 넉넉하게 잡는다. next start 는 admin 테스트가 dev mode 동작에
    // 의존(예: API mock 타이밍, hydration 차이)해서 사용하지 않는다.
    {
      command: 'pnpm --filter admin exec next dev --port 3003',
      url: 'http://localhost:3003',
      reuseExistingServer: !isCI,
      timeout: 300_000,
      env: buildEnv({
        // Firebase Web Push — 테스트에서는 불필요하므로 빈 값
        NEXT_PUBLIC_FIREBASE_API_KEY: '',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: '',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: '',
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '',
        NEXT_PUBLIC_FIREBASE_APP_ID: '',
        NEXT_PUBLIC_FIREBASE_VAPID_KEY: '',
      }),
    },

    // ── Delivery-Customer 개발 서버 ──────────────────────────────────────
    {
      command: 'pnpm --filter delivery-customer exec next dev --port 3001',
      url: 'http://localhost:3001',
      reuseExistingServer: !isCI,
      timeout: 300_000,
      env: buildEnv(),
    },

    // ── Table-Order 개발 서버 ────────────────────────────────────────────
    {
      command: 'pnpm --filter table-order exec next dev --port 3002',
      url: 'http://localhost:3002/favicon.ico',
      reuseExistingServer: !isCI,
      timeout: 300_000,
      env: buildEnv(),
    },
  ],
});
