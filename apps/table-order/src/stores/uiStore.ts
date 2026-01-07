import { create } from 'zustand';

/**
 * 상세 패널 타입
 */
export type DetailPanelType = 'call' | null;

/**
 * 상세 패널 상태 (직원호출용으로만 사용)
 */
interface DetailPanelState {
  isOpen: boolean;
  type: DetailPanelType;
}

/**
 * UI 스토어 상태
 */
interface UIState {
  // 메뉴 상세 모달 (중앙)
  selectedMenuId: string | null;

  // 상세 패널 (직원호출용)
  detailPanel: DetailPanelState;

  // 사이드바 (모바일에서 햄버거 메뉴)
  isSidebarOpen: boolean;

  // 장바구니 패널 (우측)
  isCartOpen: boolean;

  // 주문내역 패널 (우측)
  isOrderHistoryOpen: boolean;
}

/**
 * UI 스토어 액션
 */
interface UIActions {
  // 메뉴 상세 모달
  openMenuDetail: (menuId: string) => void;
  closeMenuDetail: () => void;

  // 상세 패널 (직원호출)
  openCallPanel: () => void;
  closeDetailPanel: () => void;

  // 사이드바
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // 장바구니
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // 주문내역
  openOrderHistory: () => void;
  closeOrderHistory: () => void;
  toggleOrderHistory: () => void;
}

type UIStore = UIState & UIActions;

/**
 * UI 스토어
 */
export const useUIStore = create<UIStore>((set) => ({
  // 초기 상태
  selectedMenuId: null,
  detailPanel: {
    isOpen: false,
    type: null,
  },
  isSidebarOpen: false,
  isCartOpen: true, // 기본값: 열림
  isOrderHistoryOpen: false,

  // 메뉴 상세 모달 액션
  openMenuDetail: (menuId) => {
    set({
      selectedMenuId: menuId,
    });
  },

  closeMenuDetail: () => {
    set({
      selectedMenuId: null,
    });
  },

  // 직원호출 패널 액션
  openCallPanel: () => {
    set({
      detailPanel: {
        isOpen: true,
        type: 'call',
      },
      // 장바구니 닫기
      isCartOpen: false,
    });
  },

  closeDetailPanel: () => {
    set({
      detailPanel: {
        isOpen: false,
        type: null,
      },
    });
  },

  // 사이드바 액션
  toggleSidebar: () => {
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    }));
  },

  closeSidebar: () => {
    set({
      isSidebarOpen: false,
    });
  },

  // 장바구니 액션
  openCart: () => {
    set({
      isCartOpen: true,
      // 메뉴 상세 모달 닫기
      selectedMenuId: null,
    });
  },

  closeCart: () => {
    set({
      isCartOpen: false,
    });
  },

  toggleCart: () => {
    set((state) => ({
      isCartOpen: !state.isCartOpen,
      // 장바구니를 열 때 메뉴 상세 모달 닫기
      selectedMenuId: state.isCartOpen ? state.selectedMenuId : null,
    }));
  },

  // 주문내역 액션
  openOrderHistory: () => {
    set({
      isOrderHistoryOpen: true,
      // 다른 패널들 닫기
      isCartOpen: false,
      detailPanel: {
        isOpen: false,
        type: null,
      },
    });
  },

  closeOrderHistory: () => {
    set({
      isOrderHistoryOpen: false,
    });
  },

  toggleOrderHistory: () => {
    set((state) => ({
      isOrderHistoryOpen: !state.isOrderHistoryOpen,
      // 열 때 다른 패널들 닫기
      isCartOpen: state.isOrderHistoryOpen ? state.isCartOpen : false,
      detailPanel: state.isOrderHistoryOpen ? state.detailPanel : {
        isOpen: false,
        type: null,
      },
    }));
  },
}));
