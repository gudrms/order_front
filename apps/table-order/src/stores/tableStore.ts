import { create } from 'zustand';

/**
 * 테이블 정보 관리 Store
 * - URL Query Parameter (?table=5)에서 테이블 번호를 읽어 저장
 * - 주문 시 테이블 번호 참조
 */
interface TableStore {
  /** 현재 테이블 번호 */
  tableNumber: number | null;

  /** 테이블 번호 설정 */
  setTableNumber: (tableNumber: number) => void;

  /** 테이블 번호 초기화 */
  clearTableNumber: () => void;
}

export const useTableStore = create<TableStore>((set) => ({
  tableNumber: null,

  setTableNumber: (tableNumber) => set({ tableNumber }),

  clearTableNumber: () => set({ tableNumber: null }),
}));
