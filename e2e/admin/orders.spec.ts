import { expect, test } from '@playwright/test';

const API_URL = 'http://localhost:4000/api/v1';
const storeId = 'store-orders-e2e-1';
const tableOrderId = 'order-table-paid-1';
const deliveryOrderId = 'order-delivery-ready-1';

test.describe('admin orders page', () => {
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
          id: 'admin-orders-e2e-user',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'admin-orders-e2e@example.com',
        },
      };

      window.localStorage.setItem('sb-placeholder-auth-token', JSON.stringify(session));
    });

    await page.route(`${API_URL}/auth/me`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'admin-orders-e2e-user',
            name: 'Orders E2E Admin',
            phoneNumber: '010-1111-2222',
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
              name: 'Orders E2E Store',
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

  test('updates order status and delivery status', async ({ page }) => {
    let orderStatusPayload: unknown;
    let deliveryStatusPayload: unknown;

    await page.route(`${API_URL}/stores/${storeId}/orders`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: tableOrderId,
              orderNumber: 'E2E-TABLE-001',
              storeId,
              type: 'TABLE',
              source: 'TABLE_ORDER',
              tableNumber: 7,
              items: [
                {
                  id: 'item-table-1',
                  orderId: tableOrderId,
                  menuId: 'menu-1',
                  menuName: 'Taco Set',
                  quantity: 2,
                  unitPrice: 9000,
                  totalPrice: 18000,
                },
              ],
              totalPrice: 18000,
              totalAmount: 18000,
              paymentStatus: 'PAID',
              status: 'PAID',
              createdAt: '2026-05-06T03:30:00.000Z',
              updatedAt: '2026-05-06T03:30:00.000Z',
            },
            {
              id: deliveryOrderId,
              orderNumber: 'E2E-DELIVERY-001',
              storeId,
              type: 'DELIVERY',
              source: 'DELIVERY_APP',
              items: [
                {
                  id: 'item-delivery-1',
                  orderId: deliveryOrderId,
                  menuId: 'menu-2',
                  menuName: 'Burrito',
                  quantity: 1,
                  unitPrice: 12000,
                  totalPrice: 12000,
                },
              ],
              delivery: {
                id: 'delivery-1',
                recipientName: 'Delivery Customer',
                recipientPhone: '010-2222-3333',
                address: 'Seoul',
                detailAddress: '101',
                deliveryFee: 3000,
                status: 'PENDING',
                requestedAt: '2026-05-06T03:30:00.000Z',
              },
              payments: [
                {
                  id: 'payment-delivery-1',
                  provider: 'TOSS_PAYMENTS',
                  method: 'CARD',
                  status: 'PAID',
                  amount: 15000,
                  approvedAmount: 15000,
                  cancelledAmount: 0,
                },
              ],
              totalPrice: 12000,
              totalAmount: 15000,
              paymentStatus: 'PAID',
              status: 'READY',
              createdAt: '2026-05-06T03:31:00.000Z',
              updatedAt: '2026-05-06T03:31:00.000Z',
            },
          ],
        }),
      });
    });

    await page.route(`${API_URL}/stores/${storeId}/orders/${tableOrderId}/status`, async (route) => {
      orderStatusPayload = route.request().postDataJSON();
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: { ok: true } }),
      });
    });

    await page.route(`${API_URL}/stores/${storeId}/orders/${deliveryOrderId}/delivery-status`, async (route) => {
      deliveryStatusPayload = route.request().postDataJSON();
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: { ok: true } }),
      });
    });

    await page.goto('/orders');

    await expect(page.getByTestId('admin-orders-table')).toBeVisible();
    await expect(page.getByTestId(`admin-order-row-${tableOrderId}`)).toContainText('E2E-TABLE-001');
    await expect(page.getByTestId(`admin-order-row-${deliveryOrderId}`)).toContainText('E2E-DELIVERY-001');

    await page.getByTestId(`admin-order-status-action-${tableOrderId}`).click();
    await expect(page.getByTestId('admin-order-operation-message')).toBeVisible();
    expect(orderStatusPayload).toEqual({ status: 'CONFIRMED' });

    await page.getByTestId(`admin-delivery-status-action-${deliveryOrderId}`).click();
    await expect(page.getByTestId('admin-order-operation-message')).toBeVisible();
    expect(deliveryStatusPayload).toEqual({
      status: 'ASSIGNED',
      riderMemo: '관리자 화면에서 라이더 배정 처리',
    });
  });
});
