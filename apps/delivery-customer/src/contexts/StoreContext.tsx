'use client';

import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Store } from '@order/shared';

interface StoreContextValue {
    store: Store | null;
    storeId: string | null;
    isLoading: boolean;
    error: Error | null;
    deliveryFee: number;
    orderTotal: (itemsTotal: number) => number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function getStoreLookup() {
    const storeId = process.env.NEXT_PUBLIC_STORE_ID;
    const storeType = process.env.NEXT_PUBLIC_STORE_TYPE || 'tacomolly';
    const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || 'gimpo';

    return {
        storeId,
        storeType,
        branchId,
    };
}

function calculateDeliveryFee(store: Store | null, itemsTotal: number) {
    if (!store) return 0;
    if (store.freeDeliveryThreshold && itemsTotal >= store.freeDeliveryThreshold) {
        return 0;
    }
    return store.deliveryFee || 0;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const lookup = getStoreLookup();
    const storeQuery = useQuery<Store>({
        queryKey: ['current-store', lookup.storeId, lookup.storeType, lookup.branchId],
        queryFn: () => lookup.storeId
            ? api.store.getStore(lookup.storeId)
            : api.store.getStoreByIdentifier(lookup.storeType, lookup.branchId),
        staleTime: 5 * 60 * 1000,
    });

    const store = storeQuery.data ?? null;

    return (
        <StoreContext.Provider
            value={{
                store,
                storeId: store?.id ?? null,
                isLoading: storeQuery.isLoading,
                error: storeQuery.error ?? null,
                deliveryFee: calculateDeliveryFee(store, 0),
                orderTotal: (itemsTotal) => itemsTotal + calculateDeliveryFee(store, itemsTotal),
            }}
        >
            {children}
        </StoreContext.Provider>
    );
}

export function useCurrentStore() {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useCurrentStore must be used within StoreProvider');
    }
    return context;
}
