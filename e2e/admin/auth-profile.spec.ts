import { API_URL, expect, fulfillJson, test } from './fixtures';

test('shows a retryable server error instead of the pending-approval page when /auth/me fails with 500', async ({ adminPage: page, adminMocks }) => {
  let serverDown = true;
  await page.route(`${API_URL}/auth/me`, (route) => serverDown
    ? fulfillJson(route, { statusCode: 500, message: 'Internal server error' }, 500)
    : fulfillJson(route, { data: { id: adminMocks.user.id, name: 'E2E Admin', role: 'ADMIN' } }));

  await page.goto('/menu', { waitUntil: 'domcontentloaded' });

  await expect(page.getByTestId('admin-profile-load-error')).toBeVisible();
  await expect(page).not.toHaveURL(/\/pending/);
  await expect(page.getByText('승인 대기 중')).toHaveCount(0);

  serverDown = false;
  await page.getByRole('button', { name: '다시 시도' }).click();

  await expect(page.getByTestId('admin-profile-load-error')).toHaveCount(0);
  await expect(page.getByTestId('admin-menu-page')).toBeVisible();
});
