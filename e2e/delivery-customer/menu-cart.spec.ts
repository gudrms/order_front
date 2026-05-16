import { expect, test } from './fixtures';

/**
 * 메뉴 → 장바구니 → 결제하기 E2E 플로우
 *
 * 실제 Supabase·TossPayments 없이 동작:
 *  - stub 백엔드(:4000)가 store/category/menu API 응답
 *  - Zustand in-memory 카트 상태는 클라이언트 라우팅 간 유지됨
 *
 * 최소 주문금액: CartBottomSheet 에 15,000원 하드코딩
 * E2E Taco 단가: 9,000원 → 2개(18,000원)를 기본으로 담아 minimum 통과
 */

// 공통 헬퍼: 메뉴 페이지에서 E2E Taco 수량 2개를 장바구니에 담는다
async function addTacoToCart(page: import('@playwright/test').Page) {
    await page.goto('/menu');
    await expect(page.getByText('E2E Taco')).toBeVisible({ timeout: 10_000 });

    // 메뉴 카드 클릭 → 상세 시트 오픈
    await page.getByText('E2E Taco').first().click();
    await expect(page.getByText('메뉴 상세')).toBeVisible({ timeout: 8_000 });

    // 수량 2로 증가 (9,000 × 2 = 18,000원 ≥ 최소 15,000원)
    const quantityController = page.locator('.bg-gray-50.rounded-xl');
    await quantityController.getByRole('button').last().click();
    await expect(quantityController.locator('span').filter({ hasText: '2' })).toBeVisible();

    // 장바구니 담기 → 시트 닫힘
    await page.getByRole('button', { name: /장바구니 담기/ }).click();
    await expect(page.getByText('메뉴 상세')).not.toBeVisible({ timeout: 5_000 });
}

// ── 메뉴 목록 ──────────────────────────────────────────────────────────────

test.describe('메뉴 목록', () => {
    test('stub 메뉴(E2E Taco)가 화면에 표시된다', async ({ page }) => {
        await page.goto('/menu');
        await expect(page.getByText('E2E Taco')).toBeVisible({ timeout: 10_000 });
    });

    test('메뉴 클릭 시 상세 시트가 열린다', async ({ page }) => {
        await page.goto('/menu');
        await page.getByText('E2E Taco').first().click();
        await expect(page.getByText('메뉴 상세')).toBeVisible({ timeout: 8_000 });
        await expect(
            page.getByRole('button', { name: /장바구니 담기/ })
        ).toBeVisible();
    });

    test('상세 시트에서 수량을 늘릴 수 있다', async ({ page }) => {
        await page.goto('/menu');
        await page.getByText('E2E Taco').first().click();
        await expect(page.getByText('메뉴 상세')).toBeVisible({ timeout: 8_000 });

        const quantityController = page.locator('.bg-gray-50.rounded-xl');
        await expect(
            quantityController.locator('span').filter({ hasText: '1' })
        ).toBeVisible();

        await quantityController.getByRole('button').last().click();

        await expect(
            quantityController.locator('span').filter({ hasText: '2' })
        ).toBeVisible();
    });

    test('시트 닫기 버튼으로 상세 시트를 닫을 수 있다', async ({ page }) => {
        await page.goto('/menu');
        await page.getByText('E2E Taco').first().click();
        await expect(page.getByText('메뉴 상세')).toBeVisible({ timeout: 8_000 });

        // MenuDetailBottomSheet 헤더(h2 "메뉴 상세")의 형제 닫기 버튼 클릭
        await page.getByRole('heading', { name: '메뉴 상세' }).locator('..').getByRole('button').click();
        await expect(page.getByText('메뉴 상세')).not.toBeVisible({ timeout: 5_000 });
    });
});

// ── 장바구니 담기 ──────────────────────────────────────────────────────────

test.describe('장바구니 담기', () => {
    test('담기 후 헤더 장바구니 배지에 수량이 표시된다', async ({ page }) => {
        await addTacoToCart(page);

        // 헤더 장바구니 버튼 내 배지 = totalQuantity(2)
        await expect(
            page.getByLabel('장바구니 열기').locator('span')
        ).toHaveText('2', { timeout: 5_000 });
    });

    test('담기 후 하단 "주문하기" 버튼이 나타난다', async ({ page }) => {
        await addTacoToCart(page);

        await expect(
            page.getByRole('button', { name: /주문하기/ }).last()
        ).toBeVisible({ timeout: 5_000 });
    });

    test('최소 주문금액 미달 시 장바구니 시트에 안내 메시지가 표시된다', async ({
        page,
    }) => {
        // 수량 1개만 담기 (9,000원 < 15,000원 최소)
        await page.goto('/menu');
        await page.getByText('E2E Taco').first().click();
        await expect(page.getByText('메뉴 상세')).toBeVisible({ timeout: 8_000 });
        await page.getByRole('button', { name: /장바구니 담기/ }).click();
        await expect(page.getByText('메뉴 상세')).not.toBeVisible({ timeout: 5_000 });

        // 헤더 장바구니 버튼으로 시트 열기
        await page.getByLabel('장바구니 열기').click();
        await expect(page.getByText('장바구니')).toBeVisible({ timeout: 8_000 });
        await expect(
            page.getByText(/최소 주문 금액 15,000원 미만입니다/)
        ).toBeVisible();
    });
});

// ── 장바구니 시트 ──────────────────────────────────────────────────────────

test.describe('장바구니 시트', () => {
    test('담긴 아이템이 시트에 표시된다', async ({ page }) => {
        await addTacoToCart(page);

        await page.getByRole('button', { name: /주문하기/ }).last().click();
        await expect(page.getByText('장바구니')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('E2E Taco').first()).toBeVisible();
        // 1개 메뉴 아이템 (수량 2이지만 distinct item은 1개)
        await expect(
            page.getByRole('button', { name: /1개 주문하기/ })
        ).toBeVisible();
    });

    test('닫기 버튼으로 장바구니 시트를 닫을 수 있다', async ({ page }) => {
        await addTacoToCart(page);

        await page.getByRole('button', { name: /주문하기/ }).last().click();
        await expect(page.getByText('장바구니')).toBeVisible({ timeout: 8_000 });

        await page.getByRole('button', { name: '닫기' }).click();
        await expect(page.getByText('장바구니')).not.toBeVisible({ timeout: 5_000 });
    });
});

// ── 결제하기 페이지 이동 ───────────────────────────────────────────────────

test.describe('결제하기 페이지 이동', () => {
    test('배달 정보 입력 후 결제하기 페이지로 이동한다', async ({ page }) => {
        await addTacoToCart(page);

        // 장바구니 시트 열기
        await page.getByRole('button', { name: /주문하기/ }).last().click();
        await expect(page.getByText('장바구니')).toBeVisible({ timeout: 8_000 });

        // 주문하기 → 배달 정보 입력 시트
        await page.getByRole('button', { name: /1개 주문하기/ }).click();
        await expect(page.getByText('배달 정보 입력')).toBeVisible({ timeout: 8_000 });

        // 배달 정보 입력
        await page.getByPlaceholder('기본 주소 입력').fill('서울 강남구 테헤란로 1');
        await page.getByPlaceholder('이름 입력').fill('홍길동');
        await page.getByPlaceholder('010-1234-5678').fill('010-1234-5678');

        // 다음 → /order/checkout (클라이언트 라우팅 → Zustand 카트 상태 유지)
        await page.getByRole('button', { name: '다음' }).click();
        await expect(page).toHaveURL(/\/order\/checkout/, { timeout: 10_000 });
        await expect(
            page.getByRole('heading', { name: '결제하기' })
        ).toBeVisible({ timeout: 8_000 });

        // 비로그인 상태이므로 로그인 유도 버튼
        await expect(
            page.getByRole('button', { name: '로그인하고 주문하기' })
        ).toBeVisible({ timeout: 8_000 });
    });

    test('결제하기 페이지에서 주문 내역이 표시된다', async ({ page }) => {
        await addTacoToCart(page);

        await page.getByRole('button', { name: /주문하기/ }).last().click();
        await expect(page.getByText('장바구니')).toBeVisible({ timeout: 8_000 });
        await page.getByRole('button', { name: /1개 주문하기/ }).click();
        await expect(page.getByText('배달 정보 입력')).toBeVisible({ timeout: 8_000 });
        await page.getByPlaceholder('기본 주소 입력').fill('서울 강남구 테헤란로 1');
        await page.getByPlaceholder('이름 입력').fill('홍길동');
        await page.getByPlaceholder('010-1234-5678').fill('010-1234-5678');
        await page.getByRole('button', { name: '다음' }).click();
        await expect(page).toHaveURL(/\/order\/checkout/, { timeout: 10_000 });

        // 주문 내역 섹션에 E2E Taco가 표시됨
        await expect(page.getByText('주문 내역')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByText('E2E Taco')).toBeVisible();
    });
});
