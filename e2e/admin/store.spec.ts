import { expect, test } from '@playwright/test';

const API_URL = 'http://localhost:4000/api/v1';
const storeId = 'store-settings-e2e-1';

test.describe('admin store settings page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
      const session = {
        access_token: 'e2e-access-token',
        refresh_token: 'e2e-refresh-token',
        expires_at: expiresAt,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'admin-store-e2e-user',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'admin-store-e2e@example.com',
        },
      };

      window.localStorage.setItem('sb-placeholder-auth-token', JSON.stringify(session));
    });

    await page.route(`${API_URL}/auth/me`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'admin-store-e2e-user',
            name: 'Store E2E Admin',
            phoneNumber: '010-5555-6666',
            role: 'ADMIN',
          },
        }),
      });
    });

    await page.route(`${API_URL}/stores/me`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
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
        }),
      });
    });

    await page.route(`${API_URL}/stores/${storeId}/calls`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });
  });

  test('saves basic and delivery settings', async ({ page }) => {
    let updatePayload: unknown;

    await page.route(`${API_URL}/stores/${storeId}`, async (route) => {
      updatePayload = route.request().postDataJSON();
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: { ok: true } }),
      });
    });

    await page.goto('/store');

    await expect(page.getByTestId('admin-store-save')).toBeVisible();

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
