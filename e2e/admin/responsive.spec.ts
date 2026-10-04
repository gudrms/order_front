import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

for (const [width, height] of [[375, 812], [768, 812], [1024, 768], [1024, 700], [1280, 812], [1366, 812], [1920, 812]]) {
  test(`responsive orders and navigation at ${width}x${height}px`, async ({ adminPage: page }) => {
    await page.setViewportSize({ width, height });
    await page.route(`${API_URL}/stores/store-e2e-1/orders`, (route) => fulfillJson(route, { data: [{
      id: 'responsive-order', storeId: 'store-e2e-1', orderNumber: 'MOBILE-001', type: 'DELIVERY', source: 'DELIVERY_APP', status: 'PAID', paymentStatus: 'PAID', totalAmount: 12000, totalPrice: 12000,
      createdAt: '2026-10-04T01:00:00Z', updatedAt: '2026-10-04T01:00:00Z', note: '소스 따로 주세요',
      items: [{ id: 'item', menuName: '타코', quantity: 1, selectedOptions: [{ id: 'option', optionName: '매운맛', optionPrice: 0, optionGroupName: '맛' }] }],
      delivery: { status: 'PENDING', address: '경기도 김포시 테스트로 123', detailAddress: '101동 1001호', recipientName: '테스트', recipientPhone: '010-1234-5678', deliveryMemo: '문 앞에 놓아주세요' },
      payments: [{ id: 'payment', status: 'PAID', amount: 12000 }],
    }] }));
    await page.route(`${API_URL}/stores/store-e2e-1/orders?status=*`, (route) => {
      const paid = new URL(route.request().url()).searchParams.get('status') === 'PAID';
      return fulfillJson(route, { data: paid ? [{ id: 'responsive-order', storeId: 'store-e2e-1', orderNumber: 'MOBILE-001', status: 'PAID', type: 'DELIVERY', totalAmount: 12000, items: [] }] : [] });
    });
    await gotoAdminPage(page, '/orders', width < 1024 ? 'admin-orders-cards' : 'admin-orders-table');
    await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('1건');
    const main = page.locator('main');
    expect(await main.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (width < 1024) {
      const card = page.getByTestId('admin-order-card-responsive-order');
      await expect(card).toBeVisible();
      for (const name of ['접수', '상세', '출력', '전액 취소']) {
        const button = card.getByRole('button', { name, exact: true });
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport();
        const bounds = await button.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }
      await expect(card).toContainText('매운맛');
      await expect(card).toContainText('101동 1001호');
      await expect(page.getByTestId('admin-orders-table')).toBeHidden();
      if (width < 1280) {
        await page.getByRole('button', { name: '메뉴 열기' }).click();
        await expect(page.getByRole('dialog', { name: '관리자 메뉴' })).toBeVisible();
        expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden();
        await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeFocused();
        await page.getByRole('button', { name: '메뉴 열기' }).click();
        await page.getByRole('dialog').getByRole('link', { name: '주문 관리', exact: true }).click();
        await expect(page.getByRole('dialog')).toBeHidden();
      } else {
        await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeHidden();
      }
      await card.getByRole('button', { name: '접수', exact: true }).click();
      await expect(page.getByTestId('admin-accept-dialog')).toBeVisible();
      const dialog = page.getByTestId('admin-accept-dialog');
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await dialog.getByRole('button', { name: '닫기', exact: true }).click();
      await card.getByRole('button', { name: '전액 취소' }).click();
      await expect(page.getByTestId('admin-refund-submit-full')).toBeVisible();
    } else {
      await expect(page.getByTestId('admin-orders-cards')).toBeHidden();
      await expect(page.getByTestId('admin-order-print-responsive-order')).toBeInViewport();
      await expect(page.getByTestId('admin-order-status-action-responsive-order')).toBeInViewport();
      const row = page.getByTestId('admin-order-row-responsive-order');
      await expect(row).toContainText('매운맛');
      await expect(row).toContainText('101동 1001호');
      await expect(row).toContainText('010-1234-5678');
      for (const name of ['접수', '상세', '출력', '전액 취소']) {
        const button = row.getByRole('button', { name, exact: true });
        const bounds = await button.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        expect(bounds!.height).toBeGreaterThanOrEqual(44);
        if (width === 1024) expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
      }
      expect(await page.getByTestId('admin-orders-table').locator('table').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      if (width === 1024) await page.screenshot({ path: test.info().outputPath('pos-order-list.png') });
      await row.getByRole('button', { name: '접수', exact: true }).click();
      await expect(page.getByTestId('admin-accept-dialog')).toBeVisible();
      await page.getByTestId('admin-accept-dialog').getByRole('button', { name: '닫기', exact: true }).click();
      await row.getByRole('button', { name: '전액 취소', exact: true }).click();
      await expect(page.getByTestId('admin-refund-submit-full')).toBeVisible();
    }
  });
}


for (const height of [768, 700]) {
  test(`POS shows multiple orders at 1024x${height}`, async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 1024, height });
    const rows = Array.from({ length: 8 }, (_, index) => ({
      id: `dense-${index}`, storeId: 'store-e2e-1', orderNumber: `POS-00${index + 1}`, type: 'DELIVERY', source: 'DELIVERY_APP', status: 'PAID', paymentStatus: 'PAID', totalAmount: 24000,
      createdAt: '2026-10-04T01:00:00Z', note: '소스 따로 주세요',
      items: [{ id: `item-${index}`, menuName: '비프 타코', quantity: 2, menuPrice: 12000, totalPrice: 24000, selectedOptions: [{ id: 'option', optionName: '매운맛', optionPrice: 0, optionGroupName: '맛' }] }],
      delivery: { status: 'PENDING', address: '경기도 김포시 테스트로 123', detailAddress: '101동 1001호', recipientName: '테스트', recipientPhone: '010-1234-5678', deliveryMemo: '문 앞에 놓아주세요' },
      payments: [{ id: `payment-${index}`, status: 'PAID', amount: 24000 }],
    }));
    await page.route(`${API_URL}/stores/store-e2e-1/orders*`, (route) => {
      const pending = new URL(route.request().url()).searchParams.get('status');
      return fulfillJson(route, { data: pending === 'PENDING' ? [] : rows });
    });
    await gotoAdminPage(page, '/orders', 'admin-orders-table');
    await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('8건');
    await expect(page.locator('[data-testid^="admin-order-row-dense-"]')).toHaveCount(8);
    const required = height === 768 ? 4 : 3;
    for (let index = 0; index < required; index++) {
      const row = page.getByTestId(`admin-order-row-dense-${index}`);
      const bounds = await row.boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height);
      await expect(row.getByRole('button', { name: '접수', exact: true })).toBeInViewport();
      await expect(row.getByRole('button', { name: '출력', exact: true })).toBeInViewport();
    }
    await page.screenshot({ path: test.info().outputPath('pos-multiple-orders.png') });
    await page.getByTestId('admin-order-detail-toggle-dense-0').click();
    await expect(page.getByRole('heading', { name: '주문 항목', exact: true })).toBeVisible();
  });
}
