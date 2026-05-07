import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

const storeId = 'store-orders-e2e-1';
const tableOrderId = 'order-table-paid-1';
const deliveryOrderId = 'order-delivery-ready-1';

test.describe('admin orders page', () => {
  test.use({
    adminMocks: {
      user: {
        id: 'admin-orders-e2e-user',
        email: 'admin-orders-e2e@example.com',
        name: 'Orders E2E Admin',
        phoneNumber: '010-1111-2222',
        role: 'ADMIN',
      },
      stores: [{ id: storeId, name: 'Orders E2E Store', branchName: 'Main', isActive: true }],
    },
  });

  test('manages order status, delivery status, and refunds', async ({ adminPage: page }) => {
    let orderStatusPayload: unknown;
    let deliveryStatusPayload: unknown;
    const refundOrderId = 'order-refundable-1';
    const refundRequests: unknown[] = [];

    await page.route(`${API_URL}/stores/${storeId}/orders`, async (route) => {
      await fulfillJson(route, {
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
            {
              id: refundOrderId,
              orderNumber: 'E2E-REFUND-001',
              storeId,
              type: 'DELIVERY',
              source: 'DELIVERY_APP',
              items: [
                {
                  id: 'item-refund-1',
                  orderId: refundOrderId,
                  menuId: 'menu-refund-1',
                  menuName: 'Refundable Taco',
                  quantity: 1,
                  unitPrice: 20000,
                  totalPrice: 20000,
                },
              ],
              delivery: {
                id: 'delivery-refund-1',
                recipientName: 'Refund Customer',
                recipientPhone: '010-3333-4444',
                address: 'Seoul',
                detailAddress: '202',
                deliveryFee: 3000,
                status: 'PENDING',
                requestedAt: '2026-05-06T03:40:00.000Z',
              },
              payments: [
                {
                  id: 'payment-refund-1',
                  provider: 'TOSS_PAYMENTS',
                  method: 'CARD',
                  status: 'PAID',
                  amount: 23000,
                  approvedAmount: 23000,
                  cancelledAmount: 3000,
                },
              ],
              totalPrice: 20000,
              totalAmount: 23000,
              paymentStatus: 'PAID',
              status: 'READY',
              createdAt: '2026-05-06T03:40:00.000Z',
              updatedAt: '2026-05-06T03:40:00.000Z',
            },
          ],
      });
    });

    await page.route(`${API_URL}/stores/${storeId}/orders/${tableOrderId}/status`, async (route) => {
      orderStatusPayload = route.request().postDataJSON();
      await fulfillJson(route, { data: { ok: true } });
    });

    await page.route(`${API_URL}/stores/${storeId}/orders/${deliveryOrderId}/delivery-status`, async (route) => {
      deliveryStatusPayload = route.request().postDataJSON();
      await fulfillJson(route, { data: { ok: true } });
    });

    await page.route(`${API_URL}/payments/orders/${refundOrderId}/toss/cancel`, async (route) => {
      refundRequests.push(route.request().postDataJSON());
      await fulfillJson(route, { data: { ok: true } });
    });

    await gotoAdminPage(page, '/orders', 'admin-orders-table');

    await expect(page.getByTestId(`admin-order-row-${tableOrderId}`)).toContainText('E2E-TABLE-001', { timeout: 15_000 });
    await expect(page.getByTestId(`admin-order-row-${deliveryOrderId}`)).toContainText('E2E-DELIVERY-001', { timeout: 15_000 });
    await expect(page.getByTestId(`admin-order-row-${refundOrderId}`)).toContainText('E2E-REFUND-001', { timeout: 15_000 });

    await page.getByTestId(`admin-order-status-action-${tableOrderId}`).click();
    await expect(page.getByTestId('admin-order-operation-message')).toBeVisible();
    expect(orderStatusPayload).toEqual({ status: 'CONFIRMED' });

    await page.getByTestId(`admin-delivery-status-action-${deliveryOrderId}`).click();
    await expect(page.getByTestId('admin-order-operation-message')).toBeVisible();
    expect(deliveryStatusPayload).toEqual({
      status: 'ASSIGNED',
      riderMemo: '관리자 화면에서 라이더 배정 처리',
    });

    await page.getByTestId(`admin-refund-full-${refundOrderId}`).click();
    await page.locator('textarea').fill('고객 요청 전액 취소', { timeout: 15_000 });
    await page.getByTestId('admin-refund-submit-full').click();
    await expect(page.getByTestId('admin-order-operation-message')).toBeVisible();
    expect(refundRequests[0]).toEqual({ cancelReason: '고객 요청 전액 취소' });

    await page.getByTestId(`admin-refund-partial-${refundOrderId}`).click();
    await page.locator('input[inputmode="numeric"]').fill('5000', { timeout: 15_000 });
    await page.locator('textarea').fill('고객 요청 부분 환불', { timeout: 15_000 });
    await page.getByTestId('admin-refund-submit-partial').click();
    await expect(page.getByTestId('admin-order-operation-message')).toBeVisible();
    expect(refundRequests[1]).toEqual({
      cancelReason: '고객 요청 부분 환불',
      cancelAmount: 5000,
    });
  });
});
