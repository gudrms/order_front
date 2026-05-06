import { expect, test } from '@playwright/test';

/**
 * 테이블오더 entry smoke
 *
 * stub backend(`e2e/utils/stub-backend.ts`)가 `/stores/identifier/...`
 * SSR 응답을 채워주는 전제. 메뉴/카테고리/주문 등 client-side fetch 는
 * 본 smoke 범위 외로, page.route 로 빈 응답을 흘려 메뉴 페이지 진입까지만 본다.
 */

const API_URL = 'http://localhost:4000/api/v1';
const STORE_ID = 'store-e2e-1';

test.describe('테이블 QR 진입', () => {
  test.describe.configure({ timeout: 60_000 });

  test('유효하지 않은 테이블 번호는 오류 안내가 노출된다', async ({ page }) => {
    await page.goto('/tacomolly/gimpo/table/abc');

    await expect(page.getByText('QR을 다시 스캔해주세요')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('유효하지 않은 테이블 QR입니다.')).toBeVisible();
  });

  test('테이블 번호 0도 유효하지 않은 QR로 처리된다', async ({ page }) => {
    await page.goto('/tacomolly/gimpo/table/0');

    await expect(page.getByText('QR을 다시 스캔해주세요')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('유효한 테이블 QR은 메뉴 페이지로 리다이렉트된다', async ({ page }) => {
    // 메뉴/카테고리 client fetch 는 빈 배열로 응답해 페이지가 깨지지 않게 한다
    await page.route(`${API_URL}/stores/${STORE_ID}/menus**`, (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    );
    await page.route(`${API_URL}/stores/${STORE_ID}/categories**`, (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    );

    await page.goto('/tacomolly/gimpo/table/5');

    // table=5 쿼리 파라미터를 동반한 menu 경로로 이동
    await page.waitForURL(/\/tacomolly\/gimpo\/menu\?table=5/, { timeout: 10_000 });
    expect(page.url()).toContain('/tacomolly/gimpo/menu');
    expect(page.url()).toContain('table=5');
  });
});
