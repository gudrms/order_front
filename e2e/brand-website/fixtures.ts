import { test as base, expect } from '@playwright/test';

const STUB_STORES = [
    {
        id: 'store-brand-e2e-1',
        name: '타코몰리',
        branchName: '강남점',
        isActive: true,
        isDeliveryEnabled: true,
        address: '서울시 강남구 테헤란로 1',
        phone: '02-1234-5678',
        businessHours: '10:00 - 22:00',
        deliveryFee: 3000,
        minimumOrderAmount: 15000,
        freeDeliveryThreshold: 30000,
        estimatedDeliveryTime: 30,
    },
];

const STUB_CATEGORIES = [
    { id: 'cat-brand-1', name: '타코', displayOrder: 1, isActive: true },
];

const STUB_MENUS = [
    {
        id: 'menu-brand-1',
        name: '시그니처 타코',
        price: 9000,
        description: '대표 타코',
        imageUrl: '',
        soldOut: false,
        isActive: true,
        categoryId: 'cat-brand-1',
        optionGroups: [],
    },
];

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.route('**/api/v1/stores**', async (route) => {
            await route.fulfill({ json: { data: STUB_STORES } });
        });
        await page.route('**/api/v1/stores/*/categories**', async (route) => {
            await route.fulfill({ json: { data: STUB_CATEGORIES } });
        });
        await page.route('**/api/v1/stores/*/menus**', async (route) => {
            await route.fulfill({ json: { data: STUB_MENUS } });
        });
        await use(page);
    },
});

export { expect };
