import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

const inquiry = {
  id: 'inquiry-1',
  name: '김사장',
  phone: '010-1234-5678',
  email: 'owner@example.com',
  area: '인천 서구',
  message: '검단 쪽에 가맹 상담 받고 싶습니다.',
  status: 'NEW',
  adminNote: null,
  createdAt: '2026-09-20T01:00:00.000Z',
  updatedAt: '2026-09-20T01:00:00.000Z',
};

test.describe('admin franchise inquiries page', () => {
  test('상태 필터로 조회하고 상태 변경과 메모 저장을 처리한다', async ({ adminPage: page }) => {
    const requestedQueries: string[] = [];
    const patches: unknown[] = [];
    let current = { ...inquiry };

    await page.route(`${API_URL}/franchise-inquiries**`, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }
      // 필터가 쿼리스트링으로 실려 나가는지 확인한다. ALL이면 아예 붙지 않아야 한다.
      requestedQueries.push(new URL(route.request().url()).search);
      await fulfillJson(route, { data: [current] });
    });

    await page.route(`${API_URL}/franchise-inquiries/${inquiry.id}`, async (route) => {
      const body = route.request().postDataJSON();
      patches.push(body);
      current = { ...current, ...(body as object) };
      await fulfillJson(route, { data: current });
    });

    await gotoAdminPage(page, '/franchise-inquiries', 'admin-franchise-inquiries-page');

    await expect(page.getByText('김사장')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('검단 쪽에 가맹 상담 받고 싶습니다.')).toBeVisible();
    expect(requestedQueries).toEqual(['']);

    // ── 상태 필터 ────────────────────────────────────────────────
    await page.getByRole('button', { name: '연락 완료', exact: true }).click();
    await expect.poll(() => requestedQueries.at(-1), { timeout: 10_000 }).toBe('?status=CONTACTED');

    // 전체로 되돌리면 queryKey가 ['franchise-inquiries','ALL'] 캐시에 맞아 재요청이 없다.
    // 필터 전환이 캐시를 타는 게 정상이므로 요청 수가 아니라 선택 상태로 확인한다.
    const allButton = page.getByRole('button', { name: '전체', exact: true });
    await allButton.click();
    await expect(allButton).toHaveClass(/bg-slate-900/);
    expect(requestedQueries).toEqual(['', '?status=CONTACTED']);

    // ── 메모 저장 ────────────────────────────────────────────────
    await page.getByPlaceholder('상담 이력 또는 후속 조치').fill('9/21 통화 완료, 자료 발송');
    await page.getByRole('button', { name: '메모 저장' }).click();
    await expect(page.getByText('가맹 문의가 업데이트되었습니다.')).toBeVisible({ timeout: 10_000 });
    expect(patches.at(-1)).toEqual({
      status: 'NEW',
      adminNote: '9/21 통화 완료, 자료 발송',
    });

    // ── 상태 변경 ────────────────────────────────────────────────
    // 상태를 바꿀 때도 작성 중이던 메모가 함께 실려야 메모가 날아가지 않는다.
    await page.locator('tbody select').first().selectOption('CLOSED');
    await expect.poll(() => patches.length, { timeout: 10_000 }).toBe(2);
    expect(patches.at(-1)).toEqual({
      status: 'CLOSED',
      adminNote: '9/21 통화 완료, 자료 발송',
    });
  });

  test('조회 실패는 빈 목록이 아니라 에러로 보여주고 재시도할 수 있다', async ({ adminPage: page }) => {
    let fail = true;

    await page.route(`${API_URL}/franchise-inquiries**`, (route) =>
      fulfillJson(
        route,
        fail ? { message: '가맹 문의 조회 실패' } : { data: [] },
        fail ? 500 : 200
      )
    );

    await gotoAdminPage(page, '/franchise-inquiries', 'admin-franchise-inquiries-page');

    await expect(page.getByTestId('admin-franchise-inquiries-fetch-error')).toBeVisible({
      timeout: 10_000,
    });

    fail = false;
    await page.getByRole('button', { name: '다시 시도' }).click();
    await expect(page.getByTestId('admin-franchise-inquiries-fetch-error')).toHaveCount(0, {
      timeout: 10_000,
    });
  });
});
