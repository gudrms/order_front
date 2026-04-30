'use client';

import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Store } from '@order/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStoreState } from '@/stores/adminStore';

interface AdminStoreContextValue {
  stores: Store[];
  selectedStore: Store | null;
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string) => void;
  isLoading: boolean;
  refetchStores: () => Promise<unknown>;
  authHeaders?: { Authorization: string };
}

const AdminStoreContext = createContext<AdminStoreContextValue | undefined>(undefined);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const selectedStoreId = useAdminStoreState((state) => state.selectedStoreId);
  const setSelectedStoreId = useAdminStoreState((state) => state.setSelectedStoreId);

  const authHeaders = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : undefined;

  const storesQuery = useQuery<Store[]>({
    queryKey: ['admin-stores'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stores/me`, {
        headers: authHeaders,
      });
      return response.data.data || response.data;
    },
    enabled: !!session,
  });

  const stores = storesQuery.data || [];
  const effectiveStoreId = selectedStoreId || stores[0]?.id || null;
  const selectedStore = useMemo(
    () => stores.find((store) => store.id === effectiveStoreId) || stores[0] || null,
    [effectiveStoreId, stores]
  );

  const value = useMemo<AdminStoreContextValue>(() => ({
    stores,
    selectedStore,
    selectedStoreId: selectedStore?.id || null,
    setSelectedStoreId,
    isLoading: storesQuery.isLoading,
    refetchStores: storesQuery.refetch,
    authHeaders,
  }), [stores, selectedStore, storesQuery.isLoading, storesQuery.refetch, authHeaders]);

  return (
    <AdminStoreContext.Provider value={value}>
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore() {
  const context = useContext(AdminStoreContext);
  if (!context) {
    throw new Error('useAdminStore must be used within AdminStoreProvider');
  }
  return context;
}
