import { expect, test } from '@playwright/test';

const API_URL = 'http://localhost:4000/api/v1';
const storeId = 'store-e2e-1';
const posOrderId = 'order-pos-failed-1';
const notificationId = 'notification-failed-1';

test.describe('admin operations page', () => {
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
          id: 'admin-e2e-user',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'admin-e2e@example.com',
        },
      };

      window.localStorage.setItem('sb-placeholder-auth-token', JSON.stringify(session));
    });

    await page.route(`${API_URL}/auth/me`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'admin-e2e-user',
            name: 'E2E Admin',
            phoneNumber: '010-0000-0000',
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
              name: 'E2E Store',
              branchName: 'Main',
              isActive: true,
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

  test('shows failed operations and retries each failure type', async ({ page }) => {
    let posRetryRequested = false;
    let notificationRetryRequested = false;

    await page.route(`${API_URL}/stores/${storeId}/orders/pos-sync/failed`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: posOrderId,
              orderNumber: 'E2E-ORDER-001',
              source: 'DELIVERY_APP',
              totalAmount: 23000,
              posSyncStatus: 'FAILED',
              posSyncAttemptCount: 3,
              posSyncLastError: 'POS timeout',
              posSyncUpdatedAt: '2026-05-06T03:00:00.000Z',
              updatedAt: '2026-05-06T03:00:00.000Z',
              createdAt: '2026-05-06T02:50:00.000Z',
            },
          ],
        }),
      });
    });

    await page.route(`${API_URL}/stores/${storeId}/operations/notifications/failed`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: notificationId,
              recipientType: 'CUSTOMER',
              recipientId: 'customer-e2e-1',
              notificationType: 'ORDER_PAID',
              orderId: posOrderId,
              storeId,
              channel: 'FCM',
              dedupeKey: 'order-paid:e2e',
              status: 'FAILED',
              lastError: 'FCM unavailable',
              createdAt: '2026-05-06T02:55:00.000Z',
              updatedAt: '2026-05-06T03:05:00.000Z',
            },
          ],
        }),
      });
    });

    await page.route(`${API_URL}/stores/${storeId}/orders/${posOrderId}/pos-sync/retry`, async (route) => {
      posRetryRequested = route.request().method() === 'PATCH';
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: { ok: true } }),
      });
    });

    await page.route(`${API_URL}/stores/${storeId}/operations/notifications/${notificationId}/retry`, async (route) => {
      notificationRetryRequested = route.request().method() === 'PATCH';
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: { ok: true } }),
      });
    });

    await page.goto('/operations');

    await expect(page.getByTestId('admin-operations-page')).toBeVisible();
    await expect(page.getByTestId(`admin-pos-failure-${posOrderId}`)).toContainText('E2E-ORDER-001');
    await expect(page.getByTestId(`admin-pos-failure-${posOrderId}`)).toContainText('POS timeout');
    await expect(page.getByTestId(`admin-notification-failure-${notificationId}`)).toContainText('FCM unavailable');

    await page.getByTestId(`admin-pos-retry-${posOrderId}`).click();
    await expect(page.getByTestId('admin-operations-message')).toBeVisible();
    expect(posRetryRequested).toBe(true);

    await page.getByTestId(`admin-notification-retry-${notificationId}`).click();
    await expect(page.getByTestId('admin-operations-message')).toBeVisible();
    expect(notificationRetryRequested).toBe(true);
  });
});
