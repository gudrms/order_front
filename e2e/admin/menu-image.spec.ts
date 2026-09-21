import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

const storeId = 'store-menu-image-1';
const categoryId = 'cat-image-1';
const uploadedUrl = 'https://cdn.example/assets/menu/store-menu-image-1/abc.jpg';

// 1x1 PNG. browser-image-compression이 canvas로 다시 그리므로 실제로 디코딩되는 이미지여야 한다.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test.describe('admin menu page — 메뉴 이미지 업로드', () => {
  test.use({
    adminMocks: {
      user: {
        id: 'admin-menu-image-user',
        email: 'admin-menu-image@example.com',
        name: 'Menu Image Admin',
        role: 'ADMIN',
      },
      stores: [
        {
          id: storeId,
          name: 'Image Store',
          branchName: 'Main',
          isActive: true,
          menuManagementMode: 'ADMIN_DIRECT',
        },
      ],
    },
  });

  test('이미지를 올리면 미리보기가 뜨고 메뉴 생성 요청에 imageUrl이 실린다', async ({
    adminPage: page,
  }) => {
    let uploadContentType: string | undefined;
    let menuPayload: unknown;

    await page.route(`${API_URL}/stores/${storeId}/categories`, (route) =>
      fulfillJson(route, { data: [{ id: categoryId, name: 'Drink 음료' }] })
    );
    await page.route(`${API_URL}/stores/${storeId}/admin/menus`, (route) =>
      fulfillJson(route, { data: [] })
    );

    await page.route(`${API_URL}/stores/${storeId}/menus/image`, async (route) => {
      // 압축 결과가 multipart로 실려 나가는지만 확인한다. 바이트 검증은 과하다.
      uploadContentType = route.request().headers()['content-type'];
      await fulfillJson(route, { data: { imageUrl: uploadedUrl } });
    });

    await page.route(`${API_URL}/stores/${storeId}/menus`, async (route) => {
      menuPayload = route.request().postDataJSON();
      await fulfillJson(route, { data: { id: 'menu-image-1', ...(menuPayload as object) } });
    });

    // 업로드된 이미지는 <img src>로 바로 그려지므로 외부 요청을 막아둔다.
    await page.route(uploadedUrl, (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 })
    );

    await gotoAdminPage(page, '/menu', 'admin-menu-page');

    // 파일 input은 hidden이라 버튼 클릭 대신 직접 파일을 넣는다.
    await expect(page.getByRole('button', { name: '이미지 업로드' })).toBeVisible({ timeout: 10_000 });
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'taco.png',
      mimeType: 'image/png',
      buffer: PNG_1X1,
    });

    // 업로드가 끝나면 버튼이 사라지고 미리보기와 '이미지 변경'이 나온다.
    await expect(page.getByAltText('메뉴 이미지')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: '이미지 변경' })).toBeVisible();
    expect(uploadContentType).toContain('multipart/form-data');

    // ── 업로드한 URL이 메뉴 생성까지 전달되는지 ──────────────────
    await page.getByPlaceholder('메뉴명').fill('Jarritos 하리토스');
    await page.getByPlaceholder('가격').fill('5500');
    await page.getByRole('button', { name: /메뉴 추가/ }).click();

    await expect(page.getByTestId('admin-menu-feedback')).toContainText('메뉴를 추가했습니다', {
      timeout: 10_000,
    });
    expect(menuPayload).toMatchObject({
      name: 'Jarritos 하리토스',
      price: 5500,
      categoryId,
      imageUrl: uploadedUrl,
    });
  });

  test('업로드가 실패하면 오류를 보여주고 이미지를 비워둔다', async ({ adminPage: page }) => {
    await page.route(`${API_URL}/stores/${storeId}/categories`, (route) =>
      fulfillJson(route, { data: [{ id: categoryId, name: 'Drink 음료' }] })
    );
    await page.route(`${API_URL}/stores/${storeId}/admin/menus`, (route) =>
      fulfillJson(route, { data: [] })
    );
    await page.route(`${API_URL}/stores/${storeId}/menus/image`, (route) =>
      fulfillJson(route, { message: '지원하지 않는 이미지 형식입니다. JPEG, PNG, WebP만 업로드할 수 있습니다' }, 400)
    );

    await gotoAdminPage(page, '/menu', 'admin-menu-page');
    await expect(page.getByRole('button', { name: '이미지 업로드' })).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'taco.png',
      mimeType: 'image/png',
      buffer: PNG_1X1,
    });

    await expect(page.getByText('지원하지 않는 이미지 형식입니다')).toBeVisible({ timeout: 15_000 });
    // 실패했으므로 미리보기로 넘어가지 않고 업로드 버튼이 그대로 있어야 한다.
    await expect(page.getByRole('button', { name: '이미지 업로드' })).toBeVisible();
    await expect(page.getByAltText('메뉴 이미지')).toHaveCount(0);
  });
});
