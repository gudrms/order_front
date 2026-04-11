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

export function setupCatalogListeners() {
    // add/update/delete로 모든 변경 감지 (sold-out/on-sale은 deprecated)
    posPluginSdk.catalog.on('add', () => syncCatalogs());
    posPluginSdk.catalog.on('update', () => syncCatalogs());
    posPluginSdk.catalog.on('delete', () => syncCatalogs());
}
