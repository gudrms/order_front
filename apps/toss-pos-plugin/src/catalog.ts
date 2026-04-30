import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import { API_URL, STORE_ID, posApiHeaders } from './config';

export async function syncCatalogs() {
    try {
        const catalogs = await posPluginSdk.catalog.getCatalogs();
        console.log(`Fetched ${catalogs.length} catalogs from Toss POS`);

        // SDK는 옵션을 그룹 구조로 내려줌 (PluginCatalogItemOption: id/title/isRequired/minChoices/maxChoices/choices[]).
        // 이전에는 choices를 평탄화해서 그룹 의미를 잃었음 → 그룹째로 백엔드에 전달.
        const payload = catalogs.map(c => ({
            id: c.id,
            title: c.title,
            state: c.state,
            category: { id: c.category.id, name: c.category.title },
            imageUrl: c.imageUrl,
            price: { priceValue: c.price.priceValue },
            optionGroups: c.options.map(group => ({
                id: group.id,
                title: group.title,
                isRequired: group.isRequired,
                minChoices: group.minChoices,
                maxChoices: group.maxChoices,
                choices: group.choices.map(choice => ({
                    id: choice.id,
                    title: choice.title,
                    priceValue: choice.priceValue,
                    state: choice.state,
                })),
            })),
        }));

        const response = await fetch(`${API_URL}/pos/catalogs/sync?storeId=${STORE_ID}`, {
            method: 'POST',
            headers: posApiHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ catalogs: payload }),
        });

        if (!response.ok) throw new Error(`Sync failed: HTTP ${response.status}`);
        const result = await response.json();
        console.log(`Catalog sync complete: ${result.synced} items`);
    } catch (error) {
        console.error('Catalog sync error:', error);
    }
}

// SDK Rate Limit: 10 req/sec sliding window. 일괄 수정 시 add/update/delete 폭주 방지를 위해 디바운스.
const SYNC_DEBOUNCE_MS = 800;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSync() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncTimer = null;
        syncCatalogs();
    }, SYNC_DEBOUNCE_MS);
}

export function setupCatalogListeners() {
    // add/update/delete로 모든 변경 감지 (sold-out/on-sale은 deprecated)
    posPluginSdk.catalog.on('add', scheduleSync);
    posPluginSdk.catalog.on('update', scheduleSync);
    posPluginSdk.catalog.on('delete', scheduleSync);
}
