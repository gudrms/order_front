import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

const storeDirectId = 'store-menu-direct-1';
const storeTossId = 'store-menu-toss-1';

test.describe('admin menu page — ADMIN_DIRECT mode', () => {
  test.use({
    adminMocks: {
      user: {
        id: 'admin-menu-direct-user',
        email: 'admin-menu-direct@example.com',
        name: 'Menu Direct Admin',
        role: 'ADMIN',
      },
      stores: [
        {
          id: storeDirectId,
          name: 'Direct Menu Store',
          branchName: 'Main',
          isActive: true,
          menuManagementMode: 'ADMIN_DIRECT',
        },
      ],
    },
  });

  test('creates category and menu', async ({ adminPage: page }) => {
    let categoryPayload: unknown;
    let menuPayload: unknown;
    const categoryId = 'cat-new-1';

    await page.route(`${API_URL}/stores/${storeDirectId}/categories`, async (route) => {
      if (route.request().method() === 'GET') {
        await fulfillJson(route, { data: [] });
        return;
      }
      categoryPayload = route.request().postDataJSON();
      await fulfillJson(route, {
        data: { id: categoryId, name: (categoryPayload as { name: string }).name },
      });
    });

    await page.route(`${API_URL}/stores/${storeDirectId}/admin/menus`, async (route) => {
      if (route.request().method() === 'GET') {
        await fulfillJson(route, { data: [] });
        return;
      }
      menuPayload = route.request().postDataJSON();
      await fulfillJson(route, {
        data: {
          id: 'menu-new-1',
          categoryId,
          name: (menuPayload as { name: string }).name,
          price: (menuPayload as { price: number }).price,
        },
      });
    });

    await gotoAdminPage(page, '/menu', 'admin-menu-page');

    await page.getByTestId('admin-category-name-input').fill('메인 메뉴');
    await page.getByTestId('admin-category-add-button').click();
    await expect(page.getByTestId('admin-menu-feedback')).toContainText('카테고리를 추가했습니다', { timeout: 10_000 });
    expect(categoryPayload).toEqual({ name: '메인 메뉴' });

    await page.route(`${API_URL}/stores/${storeDirectId}/categories`, async (route) => {
      await fulfillJson(route, { data: [{ id: categoryId, name: '메인 메뉴' }] });
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-menu-page')).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder('메뉴명').fill('타코 세트');
    await page.getByPlaceholder('가격').fill('12000');
    await page.getByRole('button', { name: /메뉴 추가/ }).click();
    await expect(page.getByTestId('admin-menu-feedback')).toContainText('메뉴를 추가했습니다', { timeout: 10_000 });
    expect((menuPayload as { name: string; price: number; categoryId: string })).toMatchObject({
      name: '타코 세트',
      price: 12000,
      categoryId,
    });
  });
});

test.describe('admin menu page — TOSS_POS mode', () => {
  test.use({
    adminMocks: {
      user: {
        id: 'admin-menu-toss-user',
        email: 'admin-menu-toss@example.com',
        name: 'Menu Toss Admin',
        role: 'ADMIN',
      },
      stores: [
        {
          id: storeTossId,
          name: 'Toss POS Store',
          branchName: 'Main',
          isActive: true,
          menuManagementMode: 'TOSS_POS',
        },
      ],
    },
  });

  test('syncs Toss menus and shows sync log', async ({ adminPage: page }) => {
    let syncCalled = false;

    await page.route(`${API_URL}/stores/${storeTossId}/categories`, async (route) => {
      await fulfillJson(route, { data: [] });
    });

    await page.route(`${API_URL}/stores/${storeTossId}/admin/menus`, async (route) => {
      await fulfillJson(route, { data: [] });
    });

    await page.route(`${API_URL}/stores/${storeTossId}/integrations/toss/sync-menu`, async (route) => {
      syncCalled = true;
      await fulfillJson(route, {
        data: {
          success: true,
          message: 'Toss 메뉴 동기화가 완료되었습니다.',
          syncedAt: new Date().toISOString(),
          summary: {
            categories: { received: 3, created: 2, updated: 1 },
            products: { received: 10, created: 8, updated: 2 },
          },
        },
      });
    });

    await gotoAdminPage(page, '/menu', 'admin-menu-page');

    await expect(page.getByTestId('admin-toss-menu-sync')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('admin-toss-menu-sync').click();
    await expect(page.getByTestId('admin-toss-menu-sync-log')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('admin-toss-menu-sync-log')).toContainText('Toss 메뉴 동기화 완료');
    expect(syncCalled).toBe(true);
  });
});
