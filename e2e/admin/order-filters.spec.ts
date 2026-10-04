import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

test('filters server orders by date/state and navigates pages', async ({ adminPage: page }) => {
  const requests: URL[] = [];
  await page.route(`${API_URL}/stores/store-e2e-1/orders*`, async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    const state = url.searchParams.get('state');
    const status = state === 'cancelled' ? 'CANCELLED' : state === 'completed' ? 'COMPLETED' : 'PAID';
    const pageNumber = Number(url.searchParams.get('page') || 1);
    await fulfillJson(route, { statusCode: 200, data: {
      data: [{ id: 'filter-order', storeId: 'store-e2e-1', orderNumber: `FILTER-${status}-${pageNumber}`, type: 'TABLE', status, totalAmount: 12000, items: [], createdAt: '2026-10-04T01:00:00Z' }],
      meta: { total: 21, page: pageNumber, lastPage: 2, counts: { all: 45, active: 12, cancelled: 21, completed: 12 } },
    } });
  });
  await gotoAdminPage(page, '/orders', 'admin-orders-table');
  const filters = page.getByRole('region', { name: '주문 필터' });
  await expect(filters.getByRole('button', { name: '전체 45건' })).toBeVisible();
  await page.getByLabel('시작일', { exact: true }).fill('2026-10-01');
  await page.getByLabel('종료일', { exact: true }).fill('2026-10-04');
  await filters.getByRole('button', { name: '취소 21건' }).click();
  await expect(page.getByTestId('admin-orders-table')).toContainText('FILTER-CANCELLED-1');
  await expect.poll(() => requests.some((url) => url.searchParams.get('startDate') === '2026-10-01' && url.searchParams.get('endDate') === '2026-10-04' && url.searchParams.get('state') === 'cancelled')).toBe(true);
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByTestId('admin-orders-table')).toContainText('FILTER-CANCELLED-2');
  await filters.getByRole('button', { name: '완료 12건' }).click();
  await expect(page.getByTestId('admin-orders-table')).toContainText('FILTER-COMPLETED-1');
  await expect(filters.getByRole('button', { name: '완료 12건' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('시작일', { exact: true }).fill('2026-10-05');
  await expect(page.getByRole('alert').filter({ hasText: '시작일은 종료일' })).toBeVisible();
  await filters.getByRole('button', { name: '초기화' }).click();
  await expect(page.getByLabel('시작일', { exact: true })).toHaveValue('');
  await expect(page.getByTestId('admin-orders-table')).toContainText('FILTER-PAID-1');
});
