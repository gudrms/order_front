'use client';

import { createContext, useContext } from 'react';
import type { Store } from '@order/shared';

interface StoreContextValue {
    store: Store;
    storeId: string;
    deliveryFee: number;
    orderTotal: (itemsTotal: number) => number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function calcDeliveryFee(store: Store, itemsTotal: number): number {
    if (store.freeDeliveryThreshold && itemsTotal >= store.freeDeliveryThreshold) return 0;
    return store.deliveryFee || 0;
}

export function StoreProvider({ store, children }: { store: Store; children: React.ReactNode }) {
    return (
        <StoreContext.Provider value={{
            store,
            storeId: store.id,
            deliveryFee: calcDeliveryFee(store, 0),
            orderTotal: (itemsTotal) => itemsTotal + calcDeliveryFee(store, itemsTotal),
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useCurrentStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useCurrentStore must be used within StoreProvider');
    return ctx;
}

export function useOptionalCurrentStore() {
    return useContext(StoreContext);
}
