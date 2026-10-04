import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

test('Electron alarm continues across pages and stops when pending orders are accepted', async ({ adminPage: page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('admin.orderAlerts.enabled', 'true');
    localStorage.setItem('admin.orderAlerts.soundEnabled', 'true');
    const state = { notified: [] as string[], sources: [] as string[], plays: 0, pauses: 0 };
    (window as any).__alarmTest = state;
    (window as any).adminElectron = { isElectron: true, notifyNewOrder: (payload: { orderId: string }) => state.notified.push(payload.orderId) };
    (window as any).Audio = class {
      paused = true;
      currentTime = 0;
      constructor(source: string) { state.sources.push(source); }
      play() { state.plays += 1; this.paused = false; setTimeout(() => { this.paused = true; }, 50); return Promise.resolve(); }
      pause() { this.paused = true; state.pauses += 1; }
    };
  });
  let pending = true;
  const requestedPages: string[] = [];
  await page.route(`${API_URL}/stores/store-e2e-1/orders?status=*`, async (route) => {
    const url = new URL(route.request().url());
    const status = url.searchParams.get('status');
    const currentPage = Number(url.searchParams.get('page') || 1);
    requestedPages.push(`${status}:${currentPage}`);
    const orders = pending && status === 'PAID' ? Array.from({ length: currentPage === 1 ? 20 : 1 }, (_, i) => ({ id: `pending-${currentPage}-${i}`, storeId: 'store-e2e-1', orderNumber: `P-${currentPage}-${i}`, status: 'PAID', type: 'TABLE', totalAmount: 10000, items: [], createdAt: '2026-10-04T01:00:00Z' })) : [];
    await fulfillJson(route, { statusCode: 200, data: { data: orders, meta: { lastPage: pending && status === 'PAID' ? 2 : 1 } } });
  });
  await page.route(`${API_URL}/stores/store-e2e-1/orders`, (route) => fulfillJson(route, { data: [] }));
  await gotoAdminPage(page, '/menu', 'admin-menu-page');
  await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('21건');
  await expect.poll(() => page.evaluate(() => (window as any).__alarmTest.notified.length)).toBe(21);
  expect(requestedPages).toContain('PAID:2');
  await expect.poll(() => page.evaluate(() => (window as any).__alarmTest.plays)).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as any).__alarmTest.sources)).toEqual(['/audio/pending-order.wav']);
  await page.getByRole('link', { name: '주문 관리', exact: true }).click();
  await expect(page.getByTestId('admin-orders-table')).toBeVisible();
  await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('21건');
  const before = await page.evaluate(() => (window as any).__alarmTest.plays);
  await expect.poll(() => page.evaluate(() => (window as any).__alarmTest.plays), { timeout: 6000 }).toBeGreaterThan(before);
  expect(await page.evaluate(() => (window as any).__alarmTest.notified.length)).toBe(21);
  await page.getByRole('button', { name: 'PC 알림 켜짐', exact: true }).click();
  await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('음성 알림이 꺼져');
  await page.getByRole('button', { name: '알림 꺼짐', exact: true }).click();
  await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('음성이 반복됩니다');
  pending = false;
  await expect(page.getByTestId('admin-pending-order-alarm')).toBeHidden({ timeout: 8000 });
  const finalPlays = await page.evaluate(() => (window as any).__alarmTest.plays);
  await page.waitForTimeout(4500);
  expect(await page.evaluate(() => (window as any).__alarmTest.plays)).toBe(finalPlays);
});

test('preserves disabled alerts on startup and notifies pending orders when enabled', async ({ adminPage: page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('admin.orderAlerts.enabled', 'false');
    localStorage.setItem('admin.orderAlerts.soundEnabled', 'false');
    (window as any).__alarmTest = { notified: 0, plays: 0 };
    (window as any).adminElectron = { isElectron: true, notifyNewOrder: () => { (window as any).__alarmTest.notified++; } };
    (window as any).Audio = class {
      paused = true; currentTime = 0;
      play() { (window as any).__alarmTest.plays++; return Promise.resolve(); }
      pause() {}
    };
  });
  await page.route(`${API_URL}/stores/store-e2e-1/orders?status=*`, (route) => fulfillJson(route, { data: [{ id: 'disabled-pending', storeId: 'store-e2e-1', orderNumber: 'DISABLED', status: 'PAID', type: 'TABLE', items: [], totalAmount: 10000 }] }));
  await gotoAdminPage(page, '/menu', 'admin-menu-page');
  await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('음성 알림이 꺼져');
  expect(await page.evaluate(() => (window as any).__alarmTest)).toEqual({ notified: 0, plays: 0 });
  await page.getByRole('button', { name: '알림 꺼짐', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__alarmTest.notified)).toBe(1);
  await expect.poll(() => page.evaluate(() => (window as any).__alarmTest.plays)).toBeGreaterThan(0);
});

test('reports blocked voice playback and retries after a user click', async ({ adminPage: page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('admin.orderAlerts.enabled', 'true');
    localStorage.setItem('admin.orderAlerts.soundEnabled', 'true');
    (window as any).adminElectron = { isElectron: true, notifyNewOrder: () => {} };
    (window as any).__audioAllowed = false;
    (window as any).Audio = class {
      paused = true; currentTime = 0;
      play() { return (window as any).__audioAllowed ? Promise.resolve() : Promise.reject(new DOMException('blocked', 'NotAllowedError')); }
      pause() {}
    };
  });
  await page.route(`${API_URL}/stores/store-e2e-1/orders?status=*`, (route) => fulfillJson(route, { data: [{ id: 'blocked-pending', storeId: 'store-e2e-1', orderNumber: 'BLOCKED', status: 'PAID', type: 'TABLE', items: [], totalAmount: 10000 }] }));
  await gotoAdminPage(page, '/menu', 'admin-menu-page');
  await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('음성 재생이 차단');
  await page.evaluate(() => { (window as any).__audioAllowed = true; });
  await page.getByRole('heading', { name: '메뉴 관리', exact: true }).click();
  await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('음성이 반복됩니다');
  const audio = await page.request.get('/audio/pending-order.wav');
  expect(audio.ok()).toBe(true);
  expect((await audio.body()).subarray(0, 4).toString()).toBe('RIFF');
});
