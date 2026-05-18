import { API_URL, expect, fulfillJson, gotoAdminPage, installAdminSession, test } from './fixtures';

const storeId = 'accounts-store-e2e-1';

test.describe('admin account management', () => {
  test.use({
    adminMocks: {
      user: {
        id: 'admin-accounts-e2e-user',
        email: 'admin-accounts-e2e@example.com',
        name: 'Accounts Admin',
        phoneNumber: '010-1111-2222',
        role: 'ADMIN',
      },
      stores: [
        {
          id: storeId,
          name: 'Accounts Store',
          branchName: 'Main',
          isActive: true,
        },
      ],
    },
  });

  test('creates owner accounts and supports password reset/delete actions', async ({ adminPage: page }) => {
    const accounts = [
      {
        id: 'admin-accounts-e2e-user',
        email: 'admin-accounts-e2e@example.com',
        name: 'Accounts Admin',
        role: 'ADMIN',
        stores: [],
      },
    ];
    const requests: string[] = [];

    await page.route(`${API_URL}/stores`, async (route) => {
      await fulfillJson(route, {
        data: [
          {
            id: storeId,
            name: 'Accounts Store',
            branchName: 'Main',
          },
        ],
      });
    });

    await page.route(`${API_URL}/admin/accounts`, async (route) => {
      if (route.request().method() === 'GET') {
        await fulfillJson(route, { data: accounts });
        return;
      }

      requests.push('create');
      const body = route.request().postDataJSON();
      accounts.push({
        id: 'owner-created-e2e',
        email: body.email,
        name: body.name,
        role: body.role,
        stores: [{ id: storeId, name: 'Accounts Store', branchName: 'Main' }],
      });
      await fulfillJson(route, { data: accounts.at(-1) }, 201);
    });

    await page.route(`${API_URL}/admin/accounts/owner-created-e2e/password`, async (route) => {
      requests.push('reset');
      await fulfillJson(route, { data: { id: 'owner-created-e2e', updated: true } });
    });

    await page.route(`${API_URL}/admin/accounts/owner-created-e2e`, async (route) => {
      requests.push('delete');
      accounts.splice(accounts.findIndex((account) => account.id === 'owner-created-e2e'), 1);
      await fulfillJson(route, { data: { id: 'owner-created-e2e', deleted: true } });
    });

    page.on('dialog', (dialog) => dialog.accept());

    await gotoAdminPage(page, '/accounts', 'admin-accounts-page');

    await page.locator('input[type="email"]').fill('owner-created@example.com');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('input[placeholder="이름"]').fill('Created Owner');
    await page.locator('select').nth(1).selectOption(storeId);
    await page.getByRole('button', { name: '계정 생성' }).click();

    const ownerRow = page.getByRole('row', { name: /owner-created@example\.com/ });
    await expect(ownerRow).toBeVisible();
    await ownerRow.getByPlaceholder('새 비밀번호').fill('newpassword123');
    await ownerRow.getByTitle('비밀번호 초기화').click();
    await expect(page.getByText('비밀번호를 변경했습니다.')).toBeVisible();

    await ownerRow.getByTitle('계정 삭제').click();
    await expect(page.getByText('계정을 삭제했습니다.')).toBeVisible();
    expect(requests).toEqual(['create', 'reset', 'delete']);
  });

  test('hides account management from OWNER navigation', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.route(`${API_URL}/auth/me`, async (route) => {
      await fulfillJson(route, {
        data: {
          id: 'owner-e2e-user',
          email: 'owner-e2e@example.com',
          name: 'Owner',
          phoneNumber: '010-3333-4444',
          role: 'OWNER',
        },
      });
    });
    await page.route(`${API_URL}/stores/me`, async (route) => {
      await fulfillJson(route, {
        data: [{ id: storeId, name: 'Accounts Store', branchName: 'Main', isActive: true }],
      });
    });
    await page.route(`${API_URL}/stores/${storeId}/calls`, async (route) => {
      await fulfillJson(route, { data: [] });
    });
    await page.route(`${API_URL}/stores/${storeId}/stats/daily`, async (route) => {
      await fulfillJson(route, {
        data: {
          todayOrderCount: 0,
          todaySales: 0,
          activeOrderCount: 0,
          soldOutMenuCount: 0,
        },
      });
    });
    await installAdminSession(page, {
      id: 'owner-e2e-user',
      email: 'owner-e2e@example.com',
      name: 'Owner',
      phoneNumber: '010-3333-4444',
      role: 'OWNER',
    });

    await gotoAdminPage(page, '/', undefined);

    await expect(page.getByRole('link', { name: /계정 관리/ })).toHaveCount(0);
    await context.close();
  });
});
