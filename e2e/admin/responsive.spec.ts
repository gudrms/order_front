import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

for (const width of [375, 768, 1280]) {
  test(`responsive orders and navigation at ${width}px`, async ({ adminPage: page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.route(`${API_URL}/stores/store-e2e-1/orders`, (route) => fulfillJson(route, { data: [{
      id: 'responsive-order', storeId: 'store-e2e-1', orderNumber: 'MOBILE-001', type: 'DELIVERY', source: 'DELIVERY_APP', status: 'PAID', paymentStatus: 'PAID', totalAmount: 12000, totalPrice: 12000,
      createdAt: '2026-10-04T01:00:00Z', updatedAt: '2026-10-04T01:00:00Z', note: '소스 따로 주세요',
      items: [{ id: 'item', menuName: '타코', quantity: 1, selectedOptions: [{ id: 'option', optionName: '매운맛', optionPrice: 0, optionGroupName: '맛' }] }],
      delivery: { status: 'PENDING', address: '경기도 김포시 테스트로 123', detailAddress: '101동 1001호', recipientName: '테스트', recipientPhone: '010-1234-5678', deliveryMemo: '문 앞에 놓아주세요' },
      payments: [{ id: 'payment', status: 'PAID', amount: 12000 }],
    }] }));
    await gotoAdminPage(page, '/orders', width < 768 ? 'admin-orders-cards' : 'admin-orders-table');
    const main = page.locator('main');
    expect(await main.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (width < 768) {
      const card = page.getByTestId('admin-order-card-responsive-order');
      await expect(card).toBeVisible();
      await expect(card).toContainText('매운맛');
      await expect(card).toContainText('101동 1001호');
      await expect(page.getByTestId('admin-orders-table')).toBeHidden();
      await page.getByRole('button', { name: '메뉴 열기' }).click();
      await expect(page.getByRole('dialog', { name: '관리자 메뉴' })).toBeVisible();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeFocused();
      await page.getByRole('button', { name: '메뉴 열기' }).click();
      await page.getByRole('dialog').getByRole('link', { name: '주문 관리', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeHidden();
      await card.getByRole('button', { name: '접수', exact: true }).click();
      await expect(page.getByTestId('admin-accept-dialog')).toBeVisible();
      const dialog = page.getByTestId('admin-accept-dialog');
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await dialog.getByRole('button', { name: '닫기', exact: true }).click();
      await card.getByRole('button', { name: '전액 취소' }).click();
      await expect(page.getByTestId('admin-refund-submit-full')).toBeVisible();
    } else {
      await expect(page.getByTestId('admin-orders-cards')).toBeHidden();
      await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeHidden();
    }
  });
}

