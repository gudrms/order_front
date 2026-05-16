'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Store } from '@order/shared';

const STORE_STORAGE_KEY = 'delivery.selectedStore';

interface StoreContextValue {
    store: Store | null;
    storeId: string | null;
    isLoading: boolean;
    selectStore: (store: Store) => void;
    clearStore: () => void;
    deliveryFee: number;
    orderTotal: (itemsTotal: number) => number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function calcDeliveryFee(store: Store | null, itemsTotal: number): number {
    if (!store) return 0;
    if (store.freeDeliveryThreshold && itemsTotal >= store.freeDeliveryThreshold) return 0;
    return store.deliveryFee || 0;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [store, setStore] = useState<Store | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORE_STORAGE_KEY);
            if (saved) setStore(JSON.parse(saved));
        } catch {
            // ignore corrupt storage
        }
        setIsLoading(false);
    }, []);

    const selectStore = useCallback((newStore: Store) => {
        setStore(newStore);
        try {
            localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(newStore));
        } catch {
            // ignore
        }
    }, []);

    const clearStore = useCallback(() => {
        setStore(null);
        try {
            localStorage.removeItem(STORE_STORAGE_KEY);
        } catch {
            // ignore
        }
    }, []);

    return (
        <StoreContext.Provider value={{
            store,
            storeId: store?.id ?? null,
            isLoading,
            selectStore,
            clearStore,
            deliveryFee: calcDeliveryFee(store, 0),
            orderTotal: (itemsTotal) => itemsTotal + calcDeliveryFee(store, itemsTotal),
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useCurrentStore() {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useCurrentStore must be used within StoreProvider');
    return context;
}
