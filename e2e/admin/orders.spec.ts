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
                  menuPrice: 9000,
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
                  menuPrice: 12000,
                  totalPrice: 12000,
                  selectedOptions: [
                    { id: 'opt-1', menuOptionId: 'menu-option-1', optionGroupName: '맛 선택', optionName: '망고', optionPrice: 0 },
                  ],
                },
              ],
              delivery: {
                id: 'delivery-1',
                recipientName: 'Delivery Customer',
                recipientPhone: '010-2222-3333',
                address: 'Seoul',
                detailAddress: '101',
                deliveryMemo: '문 앞에 두세요',
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
              // 실제 백엔드 주문 응답에는 totalPrice가 없다 (totalAmount만 내려옴)
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
                  menuPrice: 20000,
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

    // 결제 완료·미접수 주문(테이블 주문 1건)이 있으면 접수할 때까지 알람 배너가 떠 있다
    await expect(page.getByTestId('admin-pending-order-alarm')).toContainText('접수 대기 주문 1건');
    // 상태는 진행 막대로 보인다 (결제 완료·미접수 = 1단계 '접수 대기')
    await expect(page.getByTestId(`admin-order-progress-${tableOrderId}`)).toContainText('접수 대기');

    // 목록에 선택 옵션과 요청사항이 보여야 한다 (백엔드 selectedOptions·deliveryMemo)
    await expect(page.getByTestId(`admin-order-row-${deliveryOrderId}`)).toContainText('망고');
    await expect(page.getByTestId(`admin-order-row-${deliveryOrderId}`)).toContainText('요청: 문 앞에 두세요');

    // 상세: 단가는 백엔드 menuPrice에서 온다 (예전엔 unitPrice가 없어 화면 전체가 죽었다)
    await page.getByTestId(`admin-order-detail-toggle-${deliveryOrderId}`).click();
    await expect(page.getByText('12,000원 x 1')).toBeVisible();

    await page.getByTestId(`admin-order-status-action-${tableOrderId}`).click();
    await expect(page.getByTestId('admin-order-operation-message')).toBeVisible();
    expect(orderStatusPayload).toEqual({ status: 'COOKING' });

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
    await expect(page.getByTestId(`admin-refund-partial-${refundOrderId}`)).toHaveCount(0);

    // 주문서 출력: 확인 모달 없이 바로 인쇄된다. totalPrice 없는 배달 주문도 화면이 죽지 않아야 한다
    await page.evaluate(() => {
      const w = window as unknown as { __printedReceipt?: string };
      window.print = () => {
        w.__printedReceipt = document.querySelector('[data-testid="admin-order-receipt"]')?.textContent ?? '';
      };
    });
    await page.getByTestId(`admin-order-print-${deliveryOrderId}`).click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __printedReceipt?: string }).__printedReceipt))
      .toBeTruthy();
    const printed = await page.evaluate(() => (window as unknown as { __printedReceipt?: string }).__printedReceipt ?? '');
    expect(printed).toContain('15,000원');
    expect(printed).not.toContain('테이블:');
    // 배달 주문서에는 주소·연락처·배달비가 찍혀야 한다
    expect(printed).toContain('Seoul 101');
    expect(printed).toContain('010-2222-3333');
    // 받는 분 이름은 배달에 필요 없어 찍지 않는다
    expect(printed).not.toContain('Delivery Customer');
    expect(printed).toContain('배달비');
    // 주방이 알아야 하는 선택 옵션과 요청사항
    expect(printed).toContain('망고');
    expect(printed).toContain('문 앞에 두세요');
    // 인쇄가 끝나면 주문서는 사라지고 화면은 정상이다
    await expect(page.getByTestId('admin-order-receipt')).toHaveCount(0);
    await expect(page.getByTestId('admin-orders-table')).toBeVisible();
  });

  test('accepts a delivery order with an estimated time and prints the receipt', async ({ adminPage: page }) => {
    const paidDeliveryOrderId = 'order-delivery-paid-1';
    let acceptPayload: unknown;

    await page.route(`${API_URL}/stores/${storeId}/orders`, async (route) => {
      await fulfillJson(route, {
        data: [
          {
            id: paidDeliveryOrderId,
            orderNumber: 'E2E-ACCEPT-001',
            storeId,
            type: 'DELIVERY',
            source: 'DELIVERY_APP',
            items: [
              { id: 'item-accept-1', orderId: paidDeliveryOrderId, menuId: 'menu-3', menuName: 'Quesadilla', quantity: 1, menuPrice: 10000, totalPrice: 10000 },
            ],
            delivery: {
              id: 'delivery-accept-1',
              recipientName: 'Accept Customer',
              recipientPhone: '010-4444-5555',
              address: 'Incheon',
              deliveryFee: 3000,
              estimatedMinutes: 40,
              status: 'PENDING',
            },
            payments: [],
            totalAmount: 13000,
            paymentStatus: 'PAID',
            status: 'PAID',
            createdAt: '2026-05-06T04:00:00.000Z',
            updatedAt: '2026-05-06T04:00:00.000Z',
          },
        ],
      });
    });
    await page.route(`${API_URL}/stores/${storeId}/orders/${paidDeliveryOrderId}/status`, async (route) => {
      acceptPayload = route.request().postDataJSON();
      await fulfillJson(route, { data: { ok: true } });
    });

    await gotoAdminPage(page, '/orders', 'admin-orders-table');
    await page.evaluate(() => {
      const w = window as unknown as { __printedReceipt?: string };
      window.print = () => {
        w.__printedReceipt = document.querySelector('[data-testid="admin-order-receipt"]')?.textContent ?? '';
      };
    });

    // 배달 주문 접수는 예상 시간 선택 창이 먼저 뜨고, 기본값은 주문의 예상 시간(40분)이다
    await page.getByTestId(`admin-order-status-action-${paidDeliveryOrderId}`).click();
    await expect(page.getByTestId('admin-accept-submit')).toHaveText('40분으로 접수하고 출력');
    await page.getByTestId('admin-accept-minutes-60').click();
    await page.getByTestId('admin-accept-submit').click();

    await expect.poll(() => acceptPayload).toEqual({ status: 'COOKING', estimatedMinutes: 60 });
    // 접수하면 주문서가 자동으로 출력되고, 고른 예상 시간이 찍힌다
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __printedReceipt?: string }).__printedReceipt))
      .toContain('예상 소요 60분');
    await expect(page.getByTestId('admin-accept-dialog')).toHaveCount(0);
  });
});
