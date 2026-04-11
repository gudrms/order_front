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
            category: { id: c.category.id, name: c.category.name },
            imageUrl: c.imageUrl,
            price: { priceValue: c.price.priceValue },
            options: c.options.map(opt => ({
                id: opt.id,
                title: opt.title,
                price: opt.price?.priceValue ?? 0,
            })),
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
    posPluginSdk.catalog.on('add', () => syncCatalogs());
    posPluginSdk.catalog.on('update', () => syncCatalogs());
    posPluginSdk.catalog.on('delete', () => syncCatalogs());
    posPluginSdk.catalog.on('sold-out', () => syncCatalogs());
    posPluginSdk.catalog.on('on-sale', () => syncCatalogs());
}
