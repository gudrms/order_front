'use client';

import React, { createContext, useContext } from 'react';
import type { Store } from '@order/shared';

interface StoreContextType {
    store: Store;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({
    store,
    children,
}: {
    store: Store;
    children: React.ReactNode;
}) {
    return (
        <StoreContext.Provider value={{ store }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context.store;
}
