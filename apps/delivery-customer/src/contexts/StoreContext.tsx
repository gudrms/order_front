'use client';

import { createContext, useContext } from 'react';
import type { Store } from '@order/shared';

interface StoreContextValue {
    store: Store;
    storeId: string;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ store, children }: { store: Store; children: React.ReactNode }) {
    return (
        <StoreContext.Provider value={{ store, storeId: store.id }}>
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
