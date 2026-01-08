import { create } from 'zustand';

interface UIState {
    selectedCategory: string;
    selectedMenuId: string | null;
}

interface UIActions {
    setSelectedCategory: (categoryId: string) => void;
    setSelectedMenuId: (menuId: string | null) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
    selectedCategory: 'ALL',
    selectedMenuId: null,
    setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
    setSelectedMenuId: (menuId) => set({ selectedMenuId: menuId }),
}));
