import { expect, test } from './fixtures';

test('auth lock AbortError exits loading instead of leaving a blank Electron screen', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: () => Promise.reject(new DOMException('signal is aborted without reason', 'AbortError')) } });
  });
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  await expect(page.getByRole('heading', { name: '관리자 로그인' })).toBeVisible();
});

test('shared and admin imports create one auth client in the browser', async ({ adminPage: page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => { if (message.text().includes('Multiple GoTrueClient')) warnings.push(message.text()); });
  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: '주문 관리', exact: true })).toBeVisible();
  expect(warnings).toEqual([]);
  expect(await page.evaluate(() => (globalThis as any).__orderSupabaseClients?.size)).toBe(1);
});
