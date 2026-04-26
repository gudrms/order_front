import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tossplace/pos-plugin-sdk', () => ({
    posPluginSdk: {
        catalog: {
            getCatalogs: vi.fn(),
            on: vi.fn(),
        },
        order: { on: vi.fn() },
    },
}));

vi.mock('../config', () => ({
    API_URL: 'http://localhost:4000/api/v1',
    STORE_ID: 'store-1',
}));

import { syncCatalogs, setupCatalogListeners } from '../catalog';
import { posPluginSdk } from '@tossplace/pos-plugin-sdk';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const sampleCatalogs = [
    {
        id: 101,
        title: '비프 타코',
        state: 'ON_SALE',
        category: { id: 1, title: '메인 메뉴' },
        imageUrl: null,
        price: { priceValue: 4500 },
        options: [
            {
                id: 301,
                title: '맵기 선택',
                isRequired: true,
                minChoices: 1,
                maxChoices: 1,
                choices: [
                    { id: 201, title: '매운맛', priceValue: 500, state: 'ON_SALE' },
                ],
            },
        ],
    },
];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('syncCatalogs', () => {
    it('카탈로그를 조회하고 백엔드에 전송한다', async () => {
        (posPluginSdk.catalog.getCatalogs as any).mockResolvedValueOnce(sampleCatalogs);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true, synced: 1 }),
        });

        await syncCatalogs();

        expect(posPluginSdk.catalog.getCatalogs).toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:4000/api/v1/pos/catalogs/sync?storeId=store-1',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    catalogs: [
                        {
                            id: 101,
                            title: '비프 타코',
                            state: 'ON_SALE',
                            category: { id: 1, name: '메인 메뉴' },
                            imageUrl: null,
                            price: { priceValue: 4500 },
                            optionGroups: [
                                {
                                    id: 301,
                                    title: '맵기 선택',
                                    isRequired: true,
                                    minChoices: 1,
                                    maxChoices: 1,
                                    choices: [
                                        { id: 201, title: '매운맛', priceValue: 500, state: 'ON_SALE' },
                                    ],
                                },
                            ],
                        },
                    ],
                }),
            })
        );
    });

    it('SDK 에러 시 에러 로그만 남긴다', async () => {
        (posPluginSdk.catalog.getCatalogs as any).mockRejectedValueOnce(new Error('SDK error'));
        const consoleSpy = vi.spyOn(console, 'error');

        await syncCatalogs();

        expect(consoleSpy).toHaveBeenCalledWith('Catalog sync error:', expect.any(Error));
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('백엔드 응답 실패 시 에러 로그를 남긴다', async () => {
        (posPluginSdk.catalog.getCatalogs as any).mockResolvedValueOnce(sampleCatalogs);
        mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
        const consoleSpy = vi.spyOn(console, 'error');

        await syncCatalogs();

        expect(consoleSpy).toHaveBeenCalledWith('Catalog sync error:', expect.any(Error));
    });
});

describe('setupCatalogListeners', () => {
    it('3개의 이벤트 리스너를 등록한다', () => {
        setupCatalogListeners();

        const events = (posPluginSdk.catalog.on as any).mock.calls.map((c: any) => c[0]);
        expect(events).toEqual(['add', 'update', 'delete']);
    });
});
