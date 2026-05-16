import { expect, test as base } from '@playwright/test';

const STUB_STORE = {
  id: 'store-e2e-1',
  name: 'E2E Store',
  branchName: 'E2E Branch',
  storeType: 'tacomolly',
  branchId: 'gimpo',
  isActive: true,
  isDeliveryEnabled: true,
  menuManagementMode: 'ADMIN_DIRECT',
  deliveryFee: 0,
  minimumOrderAmount: 0,
  freeDeliveryThreshold: 0,
};

const STUB_CATEGORIES = [
  {
    id: 'category-e2e-1',
    storeId: STUB_STORE.id,
    name: 'Main',
    displayOrder: 1,
    isActive: true,
  },
];

const STUB_MENUS = [
  {
    id: 'menu-e2e-1',
    storeId: STUB_STORE.id,
    categoryId: STUB_CATEGORIES[0].id,
    name: 'E2E Taco',
    description: 'Menu item for E2E rendering',
    price: 9000,
    imageUrl: '',
    soldOut: false,
    isActive: true,
    displayOrder: 1,
    optionGroups: [],
  },
];

export const test = base.extend({
  page: async ({ page }, use) => {
    // StoreContext reads from localStorage — inject before any navigation
    await page.addInitScript((store) => {
      localStorage.setItem('delivery.selectedStore', JSON.stringify(store));
    }, STUB_STORE);

    await page.route('**/api/v1/stores/identifier/**', async (route) => {
      await route.fulfill({ json: { data: STUB_STORE } });
    });

    await page.route('**/api/v1/stores/*/categories**', async (route) => {
      await route.fulfill({ json: { data: STUB_CATEGORIES } });
    });

    await page.route('**/api/v1/stores/*/menus**', async (route) => {
      await route.fulfill({ json: { data: STUB_MENUS } });
    });

    await page.route('**/api/v1/menus/*', async (route) => {
      await route.fulfill({ json: { data: STUB_MENUS[0] } });
    });

    await page.route('**/api/v1/users/me/favorites**', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/v1/stores', async (route) => {
      await route.fulfill({ json: { data: [STUB_STORE] } });
    });

    await use(page);
  },
});

export { expect };
