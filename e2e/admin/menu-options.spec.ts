import { API_URL, expect, fulfillJson, gotoAdminPage, test } from './fixtures';

const storeId = 'store-menu-options-1';
const menuId = 'menu-options-1';
const categoryId = 'cat-options-1';
const groupId = 'group-options-1';

const baseMenu = {
  id: menuId,
  categoryId,
  name: 'Jarritos 하리토스',
  price: 5500,
  description: '망고 / 파인애플 / 구아바 / 자몽 / 라임 택1',
  imageUrl: '',
  displayOrder: 1,
  soldOut: false,
  isHidden: false,
  isActive: true,
  tossMenuCode: null,
  category: { id: categoryId, name: 'Drink 음료' },
  optionGroups: [] as unknown[],
};

test.describe('admin menu page — 옵션 그룹 CRUD', () => {
  test.use({
    adminMocks: {
      user: {
        id: 'admin-menu-options-user',
        email: 'admin-menu-options@example.com',
        name: 'Menu Options Admin',
        role: 'ADMIN',
      },
      stores: [
        {
          id: storeId,
          name: 'Options Store',
          branchName: 'Main',
          isActive: true,
          menuManagementMode: 'ADMIN_DIRECT',
        },
      ],
    },
  });

  test('옵션 그룹을 만들고 옵션을 추가한 뒤 그룹을 삭제한다', async ({ adminPage: page }) => {
    // 목록 응답은 단계마다 바뀐다. 그룹 생성 전후를 이 변수로 갈아끼운다.
    let optionGroups: unknown[] = [];
    let groupPayload: unknown;
    let optionPayload: unknown;
    let deletedGroupId: string | null = null;

    await page.route(`${API_URL}/stores/${storeId}/categories`, (route) =>
      fulfillJson(route, { data: [{ id: categoryId, name: 'Drink 음료' }] })
    );

    await page.route(`${API_URL}/stores/${storeId}/admin/menus`, (route) =>
      fulfillJson(route, { data: [{ ...baseMenu, optionGroups }] })
    );

    await page.route(`${API_URL}/stores/${storeId}/menus/${menuId}/option-groups`, async (route) => {
      groupPayload = route.request().postDataJSON();
      optionGroups = [
        {
          id: groupId,
          name: (groupPayload as { name: string }).name,
          minSelect: (groupPayload as { minSelect: number }).minSelect,
          maxSelect: (groupPayload as { maxSelect: number }).maxSelect,
          displayOrder: 0,
          options: [],
        },
      ];
      await fulfillJson(route, { data: optionGroups[0] });
    });

    await page.route(
      `${API_URL}/stores/${storeId}/menus/${menuId}/option-groups/${groupId}/options`,
      async (route) => {
        optionPayload = route.request().postDataJSON();
        (optionGroups[0] as { options: unknown[] }).options = [
          {
            id: 'option-1',
            name: (optionPayload as { name: string }).name,
            price: (optionPayload as { price: number }).price,
            displayOrder: 0,
            isSoldOut: false,
          },
        ];
        await fulfillJson(route, { data: (optionGroups[0] as { options: unknown[] }).options[0] });
      }
    );

    await page.route(
      `${API_URL}/stores/${storeId}/menus/${menuId}/option-groups/${groupId}`,
      async (route) => {
        if (route.request().method() !== 'DELETE') {
          await route.fallback();
          return;
        }
        deletedGroupId = groupId;
        optionGroups = [];
        await fulfillJson(route, { data: { id: groupId } });
      }
    );

    await gotoAdminPage(page, '/menu', 'admin-menu-page');
    await expect(page.getByRole('heading', { name: 'Jarritos 하리토스' })).toBeVisible({ timeout: 10_000 });

    // 옵션 패널은 접혀 있다. 열어야 그룹 추가 폼이 나온다.
    await page.getByRole('button', { name: /옵션/ }).click();
    const groupNameInput = page.getByPlaceholder('그룹명 (예: 맵기 선택)');
    await expect(groupNameInput).toBeVisible({ timeout: 8_000 });

    // ── 그룹 추가 ────────────────────────────────────────────────
    await groupNameInput.fill('맛 선택');
    const minInput = page.getByLabel('최소');
    const maxInput = page.getByLabel('최대');
    await minInput.fill('1');
    await maxInput.fill('1');
    // 최소 1이면 고객이 반드시 골라야 하므로 (필수)로 표시된다.
    await expect(page.getByText('(필수)')).toBeVisible();

    await page.getByRole('button', { name: '그룹 추가' }).click();
    await expect(page.getByTestId('admin-menu-feedback')).toContainText('옵션 그룹을 추가했습니다', {
      timeout: 10_000,
    });
    expect(groupPayload).toEqual({ name: '맛 선택', minSelect: 1, maxSelect: 1 });

    // ── 옵션 추가 ────────────────────────────────────────────────
    await expect(page.getByPlaceholder('옵션명')).toBeVisible({ timeout: 8_000 });
    await page.getByPlaceholder('옵션명').fill('망고');
    await page.getByPlaceholder('추가가격').fill('0');
    await page.getByPlaceholder('추가가격').press('Enter');

    await expect(page.getByTestId('admin-menu-feedback')).toContainText('옵션을 추가했습니다', {
      timeout: 10_000,
    });
    expect(optionPayload).toMatchObject({ name: '망고', price: 0 });

    // ── 그룹 삭제 ────────────────────────────────────────────────
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTitle('그룹 삭제').click();
    await expect(page.getByTestId('admin-menu-feedback')).toContainText('옵션 그룹을 삭제했습니다', {
      timeout: 10_000,
    });
    expect(deletedGroupId).toBe(groupId);
  });
});
