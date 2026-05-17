import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 결제 흐름 E2E 테스트
 *
 * 실제 TossPayments SDK·결제 자격증명 없이 동작:
 *  - /store/:id/order/success  : confirm API 모킹 → 성공·에러·재시도 UI 검증
 *  - /store/:id/order/fail     : fail API 모킹 → 실패 메시지·버튼 네비게이션 검증
 *  - /store/:id/order/checkout : 장바구니 비어있을 때 /menu 리다이렉트 검증
 *
 * TossPayments 위젯 자체(외부 SDK)는 테스트 범위 외.
 */

const STUB_STORE_ID = 'test-store-e2e';

const STUB_STORE = {
    id: STUB_STORE_ID,
    storeType: 'MEXICAN',
    branchId: 'test-branch',
    name: '타코몰리 테스트점',
    branchName: '테스트',
    type: 'MEXICAN',
    menuManagementMode: 'ADMIN_DIRECT',
    tossBranchCode: null,
    description: null,
    address: '서울시 테스트구 테스트로 1',
    phoneNumber: null,
    businessHours: null,
    theme: null,
    isActive: true,
    isDeliveryEnabled: true,
    minimumOrderAmount: 10000,
    deliveryFee: 0,
    freeDeliveryThreshold: null,
    deliveryRadiusMeters: null,
    estimatedDeliveryMinutes: 40,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

const STUB_ORDER = {
    id: 'order-e2e-1',
    orderNumber: 'ORD-20260516-001',
    status: 'CONFIRMED',
    totalAmount: 15000,
    paymentAmount: 15000,
};

async function mockStoreApi(page: Page) {
    await page.route(`**/api/v1/stores/${STUB_STORE_ID}`, async (route) => {
        await route.fulfill({ json: STUB_STORE });
    });
}

const SUCCESS_URL = `/store/${STUB_STORE_ID}/order/success`;
const FAIL_URL = `/store/${STUB_STORE_ID}/order/fail`;
const CHECKOUT_URL = `/store/${STUB_STORE_ID}/order/checkout`;

// ── 결제 성공 페이지 ────────────────────────────────────────────────────────

test.describe('결제 성공 페이지 (/store/:id/order/success)', () => {
    test('유효한 파라미터로 결제 승인이 처리된다', async ({ page }) => {
        await mockStoreApi(page);
        await page.route('**/api/v1/payments/toss/confirm', async (route) => {
            await route.fulfill({ json: STUB_ORDER });
        });

        await page.goto(
            `${SUCCESS_URL}?orderId=ord-e2e-001&paymentKey=test_pk_xxx&amount=15000`
        );

        await expect(page.getByText('주문이 접수되었습니다')).toBeVisible({
            timeout: 10_000,
        });
        await expect(page.getByText('ORD-20260516-001')).toBeVisible();
    });

    test('결제 승인 중 로딩 상태가 표시된다', async ({ page }) => {
        await mockStoreApi(page);
        let resolveRoute!: () => void;
        const routeHeld = new Promise<void>((r) => {
            resolveRoute = r;
        });

        await page.route('**/api/v1/payments/toss/confirm', async (route) => {
            await routeHeld;
            await route.fulfill({ json: STUB_ORDER });
        });

        await page.goto(
            `${SUCCESS_URL}?orderId=ord-e2e-001&paymentKey=test_pk_xxx&amount=15000`
        );

        await expect(page.getByText('결제를 승인하고 있습니다.')).toBeVisible({
            timeout: 8_000,
        });

        resolveRoute();
    });

    test('필수 파라미터 없이 접근 시 에러 메시지가 표시된다', async ({ page }) => {
        await mockStoreApi(page);
        await page.goto(SUCCESS_URL);

        await expect(
            page.getByText('결제 승인에 필요한 정보가 올바르지 않습니다.')
        ).toBeVisible({ timeout: 10_000 });
    });

    test('승인 API 실패 시 에러 안내와 재시도 버튼이 표시된다', async ({ page }) => {
        await mockStoreApi(page);
        await page.route('**/api/v1/payments/toss/confirm', async (route) => {
            await route.fulfill({
                status: 500,
                json: { message: 'Internal server error' },
            });
        });

        await page.goto(
            `${SUCCESS_URL}?orderId=ord-e2e-001&paymentKey=test_pk_xxx&amount=15000`
        );

        await expect(
            page.getByText('결제는 완료되었지만 주문 승인 처리 중 오류가 발생했습니다')
        ).toBeVisible({ timeout: 10_000 });
        await expect(
            page.getByRole('button', { name: '다시 승인 확인하기' })
        ).toBeVisible();
    });

    test('재시도 버튼 클릭 시 confirm API 를 다시 호출한다', async ({ page }) => {
        await mockStoreApi(page);
        let callCount = 0;
        await page.route('**/api/v1/payments/toss/confirm', async (route) => {
            callCount++;
            if (callCount === 1) {
                await route.fulfill({
                    status: 500,
                    json: { message: 'first call fails' },
                });
            } else {
                await route.fulfill({ json: STUB_ORDER });
            }
        });

        await page.goto(
            `${SUCCESS_URL}?orderId=ord-e2e-001&paymentKey=test_pk_xxx&amount=15000`
        );

        await page
            .getByRole('button', { name: '다시 승인 확인하기' })
            .click({ timeout: 10_000 });

        await expect(page.getByText('주문이 접수되었습니다')).toBeVisible({
            timeout: 10_000,
        });
    });

    test('승인 성공 후 "주문 상세 보기"와 "홈으로" 버튼이 표시된다', async ({
        page,
    }) => {
        await mockStoreApi(page);
        await page.route('**/api/v1/payments/toss/confirm', async (route) => {
            await route.fulfill({ json: STUB_ORDER });
        });

        await page.goto(
            `${SUCCESS_URL}?orderId=ord-e2e-001&paymentKey=test_pk_xxx&amount=15000`
        );

        await expect(page.getByText('주문이 접수되었습니다')).toBeVisible({
            timeout: 10_000,
        });
        await expect(
            page.getByRole('button', { name: '주문 상세 보기' })
        ).toBeVisible();
        await expect(page.getByRole('button', { name: '홈으로' })).toBeVisible();
    });

    test('"홈으로" 버튼 클릭 시 홈으로 이동한다', async ({ page }) => {
        await mockStoreApi(page);
        await page.route('**/api/v1/payments/toss/confirm', async (route) => {
            await route.fulfill({ json: STUB_ORDER });
        });

        await page.goto(
            `${SUCCESS_URL}?orderId=ord-e2e-001&paymentKey=test_pk_xxx&amount=15000`
        );

        await page.getByRole('button', { name: '홈으로' }).click({ timeout: 10_000 });
        await expect(page).toHaveURL('/', { timeout: 8_000 });
    });
});

// ── 결제 실패 페이지 ────────────────────────────────────────────────────────

test.describe('결제 실패 페이지 (/store/:id/order/fail)', () => {
    test('결제 실패 안내 메시지가 표시된다', async ({ page }) => {
        await mockStoreApi(page);
        await page.route('**/api/v1/payments/toss/fail', async (route) => {
            await route.fulfill({ json: {} });
        });

        await page.goto(
            `${FAIL_URL}?orderId=ord-e2e-001&code=CARD_DECLINED&message=카드가 거절되었습니다`
        );

        await expect(
            page.getByText('결제가 완료되지 않았어요')
        ).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('카드가 거절되었습니다')).toBeVisible();
    });

    test('orderId 없이 접근해도 실패 페이지가 정상 렌더링된다', async ({ page }) => {
        await mockStoreApi(page);
        await page.goto(`${FAIL_URL}?code=USER_CANCEL&message=사용자가 결제를 취소했습니다`);

        await expect(
            page.getByText('결제가 완료되지 않았어요')
        ).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('사용자가 결제를 취소했습니다')).toBeVisible();
    });

    test('"다시 결제하기" 클릭 시 /order/checkout 으로 이동한다 (빈 장바구니면 /menu 로 리다이렉트)', async ({
        page,
    }) => {
        await mockStoreApi(page);
        await page.route('**/api/v1/payments/toss/fail', async (route) => {
            await route.fulfill({ json: {} });
        });

        await page.goto(
            `${FAIL_URL}?orderId=ord-e2e-001&code=CARD_DECLINED&message=카드가 거절되었습니다`
        );

        await expect(
            page.getByText('결제가 완료되지 않았어요')
        ).toBeVisible({ timeout: 8_000 });
        await page.getByRole('button', { name: '다시 결제하기' }).click();

        // 장바구니가 비어 있으므로 /order/checkout → /menu 로 최종 리다이렉트됨
        await expect(page).toHaveURL(/\/menu|\/order\/checkout/, {
            timeout: 8_000,
        });
    });

    test('"메뉴로 돌아가기" 클릭 시 /menu 로 이동한다', async ({ page }) => {
        await mockStoreApi(page);
        await page.route('**/api/v1/payments/toss/fail', async (route) => {
            await route.fulfill({ json: {} });
        });

        await page.goto(
            `${FAIL_URL}?orderId=ord-e2e-001&code=CARD_DECLINED&message=카드가 거절되었습니다`
        );

        await expect(
            page.getByText('결제가 완료되지 않았어요')
        ).toBeVisible({ timeout: 8_000 });
        await page.getByRole('button', { name: '메뉴로 돌아가기' }).click();
        await expect(page).toHaveURL(/\/menu/, { timeout: 8_000 });
    });
});

// ── 결제하기 페이지 ─────────────────────────────────────────────────────────

test.describe('결제하기 페이지 (/store/:id/order/checkout)', () => {
    test('장바구니가 비어있으면 /menu 로 리다이렉트된다', async ({ page }) => {
        await mockStoreApi(page);
        await page.goto(CHECKOUT_URL);
        await expect(page).toHaveURL(/\/menu/, { timeout: 8_000 });
    });

});
