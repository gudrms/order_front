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

  // 메뉴 상세 모달 액션
  openMenuDetail: (menuId) => {
    console.log('🏪 uiStore.openMenuDetail 호출:', menuId);
    set({
      selectedMenuId: menuId,
    });
    console.log('🏪 uiStore.openMenuDetail 완료 - selectedMenuId 설정됨');
  },

  closeMenuDetail: () => {
    console.log('🏪 uiStore.closeMenuDetail 호출');
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
    }));
  },
}));
