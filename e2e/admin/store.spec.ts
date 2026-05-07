import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

const storeId = 'store-settings-e2e-1';

test.describe('admin store settings page', () => {
  test.use({
    adminMocks: {
      user: {
        id: 'admin-store-e2e-user',
        email: 'admin-store-e2e@example.com',
        name: 'Store E2E Admin',
        phoneNumber: '010-5555-6666',
        role: 'ADMIN',
      },
      stores: [
        {
          id: storeId,
          storeType: 'taco',
          branchId: 'main',
          name: 'Before Store',
          branchName: 'Before Branch',
          phoneNumber: '010-0000-0000',
          address: 'Before Address',
          isActive: true,
          isDeliveryEnabled: false,
          minimumOrderAmount: 10000,
          deliveryFee: 3000,
          freeDeliveryThreshold: null,
          estimatedDeliveryMinutes: null,
          menuManagementMode: 'TOSS_POS',
          inviteCode: 'INVITE-E2E',
        },
      ],
    },
  });

  test('saves basic and delivery settings', async ({ adminPage: page }) => {
    let updatePayload: unknown;

    await page.route(`${API_URL}/stores/${storeId}`, async (route) => {
      updatePayload = route.request().postDataJSON();
      await fulfillJson(route, { data: { ok: true } });
    });

    await gotoAdminPage(page, '/store', 'admin-store-save');

    const inputs = page.locator('input');
    await inputs.nth(0).fill('After Store');
    await inputs.nth(1).fill('After Branch');
    await inputs.nth(2).fill('010-9999-8888');
    await inputs.nth(3).fill('After Address');
    await page.getByRole('button', { name: 'OFF' }).click();
    await inputs.nth(4).fill('15000');
    await inputs.nth(5).fill('3500');
    await inputs.nth(6).fill('30000');
    await inputs.nth(7).fill('45');

    await page.getByTestId('admin-store-save').click();

    await expect(page.getByTestId('admin-store-feedback')).toBeVisible();
    expect(updatePayload).toEqual({
      name: 'After Store',
      branchName: 'After Branch',
      phoneNumber: '010-9999-8888',
      address: 'After Address',
      isDeliveryEnabled: true,
      minimumOrderAmount: 15000,
      deliveryFee: 3500,
      freeDeliveryThreshold: 30000,
      estimatedDeliveryMinutes: 45,
      menuManagementMode: 'TOSS_POS',
    });
  });
});
