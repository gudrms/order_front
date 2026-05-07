import { expect, test } from './fixtures';

/**
 * 배달앱(delivery-customer) E2E
 *
 * 실제 Supabase 자격증명 없이도 동작:
 *  - 홈 페이지 렌더링
 *  - 로그인 페이지 OAuth 버튼 확인
 *  - 미인증 상태에서 주문 내역 진입 시 로그인 안내 표시
 *  - 메뉴 페이지 접근
 *  - 잘못된 경로 404 또는 홈으로 폴백
 */

test.describe('홈 페이지', () => {
  test('메인 페이지가 로드된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('기본 레이아웃(헤더/하단 네비게이션)이 렌더링된다', async ({ page }) => {
    await page.goto('/');
    // 하단 네비게이션 확인 (BottomNav)
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('로그인 페이지', () => {
  test('카카오 로그인 버튼이 표시된다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('카카오 로그인')).toBeVisible();
  });

  test('Apple 로그인 버튼이 표시된다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Apple로 로그인')).toBeVisible();
  });

  test('로그인 없이 둘러보기 링크가 표시된다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('로그인 없이 둘러보기')).toBeVisible();
  });

  test('로그인 없이 둘러보기 클릭 시 홈으로 이동한다', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('로그인 없이 둘러보기').click();
    await expect(page).toHaveURL('/', { timeout: 8_000 });
  });
});

test.describe('주문 내역 페이지 (비인증)', () => {
  test('미로그인 시 "로그인이 필요합니다" 안내가 표시된다', async ({ page }) => {
    await page.goto('/orders');

    // 인증 로딩이 완료될 때까지 대기 후 로그인 안내 확인
    await expect(page.getByText('로그인이 필요합니다')).toBeVisible({
      timeout: 12_000,
    });
  });

  test('미로그인 시 "로그인하고 주문 내역 보기" 버튼이 표시된다', async ({ page }) => {
    await page.goto('/orders');
    await expect(
      page.getByRole('button', { name: /로그인하고 주문 내역 보기/ })
    ).toBeVisible({ timeout: 12_000 });
  });

  test('로그인 버튼 클릭 시 /login 으로 이동한다', async ({ page }) => {
    await page.goto('/orders');
    await page
      .getByRole('button', { name: /로그인하고 주문 내역 보기/ })
      .click({ timeout: 12_000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

test.describe('메뉴 페이지', () => {
  test('메뉴 페이지가 접근 가능하다', async ({ page }) => {
    await page.goto('/menu');
    // 로딩 상태 또는 에러 상태 중 하나가 표시됨 (API 연결 없이도 렌더링)
    await expect(page.locator('main')).toBeVisible({ timeout: 8_000 });
  });

  test('헤더에 장바구니 버튼이 있다', async ({ page }) => {
    await page.goto('/menu');
    await expect(
      page.getByRole('button', { name: /장바구니/ })
    ).toBeVisible({ timeout: 10_000 });
  });
});
