import { create } from 'zustand';

/**
 * 상세 패널 타입
 */
export type DetailPanelType = 'menu' | 'call' | null;

/**
 * 상세 패널 상태
 */
interface DetailPanelState {
  isOpen: boolean;
  type: DetailPanelType;
  menuId?: string; // 메뉴 상세일 때만 사용 (UUID)
}

/**
 * UI 스토어 상태
 */
interface UIState {
  // 상세 패널 (메뉴 상세 또는 직원호출)
  detailPanel: DetailPanelState;

  // 사이드바 (모바일에서 햄버거 메뉴)
  isSidebarOpen: boolean;

  // 장바구니 드로어
  isCartOpen: boolean;
}

/**
 * UI 스토어 액션
 */
interface UIActions {
  // 상세 패널
  openMenuDetail: (menuId: string) => void;
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
  detailPanel: {
    isOpen: false,
    type: null,
  },
  isSidebarOpen: false,
  isCartOpen: true, // 기본값: 열림

  // 상세 패널 액션
  openMenuDetail: (menuId) => {
    set({
      detailPanel: {
        isOpen: true,
        type: 'menu',
        menuId,
      },
      // 다른 UI 요소 닫기
      isCartOpen: false,
    });
  },

  openCallPanel: () => {
    set({
      detailPanel: {
        isOpen: true,
        type: 'call',
        menuId: undefined,
      },
      // 다른 UI 요소 닫기
      isCartOpen: false,
    });
  },

  closeDetailPanel: () => {
    set({
      detailPanel: {
        isOpen: false,
        type: null,
        menuId: undefined,
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
      // 다른 UI 요소 닫기
      detailPanel: {
        isOpen: false,
        type: null,
        menuId: undefined,
      },
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
      // 장바구니 열 때 다른 UI 요소 닫기
      ...(state.isCartOpen
        ? {}
        : {
            detailPanel: {
              isOpen: false,
              type: null,
              menuId: undefined,
            },
          }),
    }));
  },
}));
