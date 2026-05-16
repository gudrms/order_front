import { test as base, expect } from '@playwright/test';

const STUB_STORES = [
    {
        id: 'store-brand-e2e-1',
        name: '타코몰리',
        branchName: '부평점',
        isActive: true,
        isDeliveryEnabled: true,
        address: '인천 부평구 장제로249번길 9 1층',
        phoneNumber: '032-555-7777',
        businessHours: { default: '11:00 - 22:00' },
        deliveryFee: 3000,
        minimumOrderAmount: 15000,
        freeDeliveryThreshold: 30000,
        estimatedDeliveryMinutes: 30,
        lat: 37.507,
        lng: 126.722,
    },
    {
        id: 'store-brand-e2e-2',
        name: '타코몰리',
        branchName: '루원시티점',
        isActive: true,
        isDeliveryEnabled: true,
        address: '인천 서구 서곶로 45',
        phoneNumber: '032-777-8888',
        businessHours: { default: '11:00 - 22:00' },
        deliveryFee: 3000,
        minimumOrderAmount: 15000,
        freeDeliveryThreshold: 30000,
        estimatedDeliveryMinutes: 35,
        lat: 37.525,
        lng: 126.675,
    },
];

const STUB_CATEGORIES = [
    { id: 'cat-brand-1', name: '타코', sortOrder: 1, displayOrder: 1, isActive: true },
];

const STUB_MENUS = [
    {
        id: 'menu-brand-1',
        name: '시그니처 타코',
        price: 9000,
        description: '대표 타코',
        imageUrl: '',
        isAvailable: true,
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
