import { test, expect } from '@playwright/test';

/**
 * 관리자 웹 — 인증/라우트 보호 E2E
 *
 * 실제 Supabase 자격증명 없이도 동작하는 테스트들:
 *  - 로그인 페이지 렌더링 검증
 *  - 잘못된 자격증명 → 에러 메시지 표시
 *  - 미인증 상태에서 보호된 라우트 → /login 리다이렉트
 */

test.describe('관리자 로그인 페이지', () => {
  test('이메일/비밀번호 폼이 올바르게 렌더링된다', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: '관리자 로그인' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
  });

  test('빈 폼으로 로그인 시 유효성 에러가 표시된다', async ({ page }) => {
    await page.goto('/login');

    // 이메일·비밀번호 미입력 상태로 로그인 클릭 → 클라이언트 유효성 검증 에러
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(
      page.locator('[class*="text-red"], [class*="bg-red"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('잘못된 자격증명 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword123');
    await page.getByRole('button', { name: '로그인' }).click();

    // Supabase 에러 또는 네트워크 오류 메시지 표시 대기
    await expect(
      page.locator('[class*="text-red"], [class*="bg-red"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('관리자 인증 가드 (보호된 라우트)', () => {
  test('미인증 상태에서 대시보드(/) 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('미인증 상태에서 주문 목록(/orders) 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('미인증 상태에서 메뉴 관리(/menu) 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/menu');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('미인증 상태에서 매장 설정(/store) 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/store');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('미인증 상태에서 직원 호출(/calls) 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/calls');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('미인증 상태에서 운영 관리(/operations) 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/operations');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('미인증 상태에서 가맹 문의(/franchise-inquiries) 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/franchise-inquiries');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
