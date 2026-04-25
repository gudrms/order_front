import { posPluginSdk } from '@tossplace/pos-plugin-sdk';
import { API_URL, STORE_ID } from './config';

export async function syncCatalogs() {
    try {
        const catalogs = await posPluginSdk.catalog.getCatalogs();
        console.log(`Fetched ${catalogs.length} catalogs from Toss POS`);

        const payload = catalogs.map(c => ({
            id: c.id,
            title: c.title,
            state: c.state,
            category: { id: c.category.id, name: c.category.title },
            imageUrl: c.imageUrl,
            price: { priceValue: c.price.priceValue },
            options: c.options.flatMap(opt =>
                opt.choices.map(choice => ({
                    id: choice.id,
                    title: choice.title,
                    price: choice.priceValue,
                }))
            ),
        }));

        const response = await fetch(`${API_URL}/pos/catalogs/sync?storeId=${STORE_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
