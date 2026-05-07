import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

const storeId = 'store-e2e-1';
const posOrderId = 'order-pos-failed-1';
const notificationId = 'notification-failed-1';

test.describe('admin operations page', () => {
  test.use({
    adminMocks: {
      user: {
        id: 'admin-e2e-user',
        email: 'admin-e2e@example.com',
        name: 'E2E Admin',
        phoneNumber: '010-0000-0000',
        role: 'ADMIN',
      },
      stores: [{ id: storeId, name: 'E2E Store', branchName: 'Main', isActive: true }],
    },
  });

  test('shows failed operations and retries each failure type', async ({ adminPage: page }) => {
    let posRetryRequested = false;
    let notificationRetryRequested = false;

    await page.route(`${API_URL}/stores/${storeId}/orders/pos-sync/failed`, async (route) => {
      await fulfillJson(route, {
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
      });
    });

    await page.route(`${API_URL}/stores/${storeId}/operations/notifications/failed`, async (route) => {
      await fulfillJson(route, {
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
      });
    });

    await page.route(`${API_URL}/stores/${storeId}/orders/${posOrderId}/pos-sync/retry`, async (route) => {
      posRetryRequested = route.request().method() === 'PATCH';
      await fulfillJson(route, { data: { ok: true } });
    });

    await page.route(`${API_URL}/stores/${storeId}/operations/notifications/${notificationId}/retry`, async (route) => {
      notificationRetryRequested = route.request().method() === 'PATCH';
      await fulfillJson(route, { data: { ok: true } });
    });

    await gotoAdminPage(page, '/operations', 'admin-operations-page');

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
