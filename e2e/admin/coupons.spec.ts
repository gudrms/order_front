import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

const coupon = {
  id: 'coupon-e2e', name: '신규 가입 쿠폰', description: '첫 주문 혜택', code: 'WELCOME',
  type: 'FIXED_AMOUNT', discountValue: 3000, maxDiscountAmount: null,
  minOrderAmount: 15000, maxUses: 100, usedCount: 12, issuedCount: 40, defaultExpiryDays: 30,
  isActive: true, createdAt: '2026-09-20T00:00:00.000Z',
};

test('creates percentage and fixed coupons with the correct limits', async ({ adminPage: page }) => {
  const created: Record<string, unknown>[] = [];
  await page.route(`${API_URL}/coupons`, async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      created.push(body);
      await fulfillJson(route, { data: { ...coupon, ...body } });
    } else {
      await fulfillJson(route, { data: created.map((body, index) => ({ ...coupon, ...body, id: `coupon-${index}` })) });
    }
  });
  await gotoAdminPage(page, '/coupons', 'admin-coupons-page');
  await page.getByLabel('쿠폰 이름 *', { exact: true }).fill('정률 혜택');
  await page.getByLabel('할인 타입').selectOption('PERCENTAGE');
  await page.getByLabel('할인값 (%) *', { exact: true }).fill('10');
  const cap = page.getByLabel('정률 할인 상한 (원) *', { exact: true });
  await expect(cap).toHaveValue('5000');
  await cap.fill('');
  await page.getByRole('button', { name: '쿠폰 생성', exact: true }).click();
  expect(created).toHaveLength(0);
  expect(await cap.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
  await cap.fill('7000');
  await page.getByRole('button', { name: '쿠폰 생성', exact: true }).click();
  await expect(page.getByRole('heading', { name: '정률 혜택', exact: true })).toBeVisible();
  expect(created[0]).toMatchObject({ type: 'PERCENTAGE', discountValue: 10, maxDiscountAmount: 7000, defaultExpiryDays: 30 });
  await expect(cap).toHaveCount(0);
  await page.getByLabel('쿠폰 이름 *', { exact: true }).fill('정액 혜택');
  await page.getByLabel('할인값 (원) *', { exact: true }).fill('3000');
  await page.getByRole('button', { name: '쿠폰 생성', exact: true }).click();
  await expect(page.getByRole('heading', { name: '정액 혜택', exact: true })).toBeVisible();
  expect(created[1]).not.toHaveProperty('maxDiscountAmount');
});

test('issues a coupon, preserves failed input, and disables inactive coupons', async ({ adminPage: page }) => {
  let issueBody: unknown;
  let fail = true;
  await page.route(`${API_URL}/coupons`, (route) => fulfillJson(route, { data: [coupon, { ...coupon, id: 'inactive', name: '종료 쿠폰', isActive: false }] }));
  await page.route(`${API_URL}/coupons/${coupon.id}/issue`, async (route) => {
    issueBody = route.request().postDataJSON();
    await fulfillJson(route, fail ? { message: '사용자를 찾을 수 없습니다' } : { data: { id: 'issued' } }, fail ? 404 : 201);
  });
  await gotoAdminPage(page, '/coupons', 'admin-coupons-page');
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: coupon.name, exact: true }) });
  await expect(card).toContainText('발급: 40장 / 한도 100장');
  await expect(card).toContainText('사용: 12장');
  await expect(page.getByRole('article').filter({ hasText: '종료 쿠폰' }).getByRole('button', { name: '발급', exact: true })).toBeDisabled();
  await card.getByRole('button', { name: '발급', exact: true }).click();
  await page.getByLabel('사용자 ID *', { exact: true }).fill('customer-e2e');
  await page.getByRole('button', { name: '발급 확인' }).click();
  await expect(page.getByTestId('admin-coupons-page').getByRole('alert')).toContainText('사용자를 찾을 수 없습니다');
  await expect(page.getByLabel('사용자 ID *', { exact: true })).toHaveValue('customer-e2e');
  expect(issueBody).toEqual({ userId: 'customer-e2e' });
  fail = false;
  await page.getByLabel('발급 유효기간 (일)', { exact: true }).fill('7');
  await page.getByRole('button', { name: '발급 확인' }).click();
  await expect(page.getByRole('status')).toContainText('사용자에게 쿠폰을 발급했습니다.');
  expect(issueBody).toEqual({ userId: 'customer-e2e', expiryDays: 7 });
});

test('toggles a coupon between active and inactive', async ({ adminPage: page }) => {
  let isActive = true;
  let patchBody: unknown;
  await page.route(`${API_URL}/coupons`, (route) => fulfillJson(route, { data: [{ ...coupon, isActive }] }));
  await page.route(`${API_URL}/coupons/${coupon.id}/active`, async (route) => {
    patchBody = route.request().postDataJSON();
    isActive = (patchBody as { isActive: boolean }).isActive;
    await fulfillJson(route, { data: { ...coupon, isActive } });
  });

  await gotoAdminPage(page, '/coupons', 'admin-coupons-page');
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: coupon.name, exact: true }) });
  await expect(card).toContainText('활성');

  await card.getByRole('button', { name: '비활성화', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('쿠폰을 비활성화했습니다.');
  expect(patchBody).toEqual({ isActive: false });

  // 비활성 쿠폰은 발급이 막히고, 다시 활성화할 수 있어야 한다.
  await expect(card.getByRole('button', { name: '발급', exact: true })).toBeDisabled();
  await card.getByRole('button', { name: '활성화', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('쿠폰을 활성화했습니다.');
  expect(patchBody).toEqual({ isActive: true });
  await expect(card.getByRole('button', { name: '발급', exact: true })).toBeEnabled();
});

test('distinguishes failed queries from empty results and retries', async ({ adminPage: page }) => {
  let fail = true;
  await page.route(`${API_URL}/coupons`, (route) => fulfillJson(route, fail ? { message: '쿠폰 조회 실패' } : { data: [] }, fail ? 500 : 200));
  await gotoAdminPage(page, '/coupons', 'admin-coupons-page');
  await expect(page.getByTestId('admin-coupons-fetch-error')).toBeVisible();
  await expect(page.getByText('등록된 쿠폰이 없습니다.')).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByText('등록된 쿠폰이 없습니다.')).toBeVisible();
});

test.describe('owner permissions', () => {
  test.use({ adminMocks: { user: { id: 'owner', email: 'owner@example.com', role: 'OWNER' }, stores: [] } });
  test('hides the menu and prevents direct access', async ({ adminPage: page }) => {
    let queried = false;
    await page.route(`${API_URL}/coupons`, async (route) => { queried = true; await fulfillJson(route, { data: [] }); });
    await page.goto('/coupons');
    await expect(page).not.toHaveURL(/\/coupons/);
    await expect(page.getByRole('link', { name: '쿠폰 관리' })).toHaveCount(0);
    expect(queried).toBe(false);
  });
});
