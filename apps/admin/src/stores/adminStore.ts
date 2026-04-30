import { create } from 'zustand';

interface AdminStoreState {
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string | null) => void;
}

export const useAdminStoreState = create<AdminStoreState>((set) => ({
  selectedStoreId: null,
  setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),
}));
