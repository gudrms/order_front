import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminStoreState {
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string | null) => void;
}

// localStorage에 저장해 새로고침/재방문 시에도 매장 목록(stores/me) 응답을 기다리지 않고
// 바로 orders/stats 등 storeId 의존 쿼리를 병렬로 시작할 수 있게 한다.
export const useAdminStoreState = create<AdminStoreState>()(
  persist(
    (set) => ({
      selectedStoreId: null,
      setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),
    }),
    { name: 'admin-selected-store' }
  )
);
