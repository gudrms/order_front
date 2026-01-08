import { create } from 'zustand';
import type { CartSelectedOption } from '../types/order';

/**
 * 장바구니 아이템 타입
 */
export interface CartItem {
    id: string; // 고유 ID (menuId + 옵션 조합)
    menuId: string; // 메뉴 ID (UUID)
    menuName: string; // 메뉴 이름
    unitPrice: number; // 개당 가격 (옵션 포함)
    quantity: number; // 수량
    totalPrice: number; // 총 가격 (unitPrice × quantity)
    options?: CartSelectedOption[]; // 선택한 옵션들
    imageUrl?: string | null; // 메뉴 이미지
}

/**
 * 장바구니에 추가할 아이템 (id 제외)
 */
export interface AddCartItemInput {
    menuId: string; // UUID
    menuName: string;
    basePrice: number; // 메뉴 기본 가격
    quantity: number;
    options?: CartSelectedOption[];
    imageUrl?: string | null;
}

/**
 * 장바구니 스토어 상태
 */
interface CartState {
    items: CartItem[];
    totalPrice: number;
    totalQuantity: number;
}

/**
 * 장바구니 스토어 액션
 */
interface CartActions {
    addItem: (input: AddCartItemInput) => void;
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
    getItemById: (cartItemId: string) => CartItem | undefined;
}

type CartStore = CartState & CartActions;

/**
 * 고유 ID 생성 함수
 */
function generateCartItemId(
    menuId: string,
    options?: CartSelectedOption[]
): string {
    const baseId = `menu_${menuId}`;
    if (!options || options.length === 0) {
        return baseId;
    }
    // UUID는 문자열이므로 문자열 정렬
    const sortedOptionIds = options
        .map((opt) => opt.itemId)
        .sort((a, b) => a.localeCompare(b))
        .join('_');
    return `${baseId}_opt_${sortedOptionIds}`;
}

/**
 * 총 금액 계산 함수
 */
function calculateTotalPrice(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
}

/**
 * 총 수량 계산 함수
 */
function calculateTotalQuantity(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * 개당 가격 계산 함수 (기본 가격 + 옵션 가격)
 */
function calculateUnitPrice(
    basePrice: number,
    options?: CartSelectedOption[]
): number {
    if (!options || options.length === 0) {
        return basePrice;
    }
    const optionsPrice = options.reduce((sum, opt) => sum + opt.price, 0);
    return basePrice + optionsPrice;
}

/**
 * 장바구니 스토어
 */
export const useCartStore = create<CartStore>((set, get) => ({
    items: [],
    totalPrice: 0,
    totalQuantity: 0,

    addItem: (input) => {
        const { menuId, menuName, basePrice, quantity, options, imageUrl } = input;
        const cartItemId = generateCartItemId(menuId, options);
        const unitPrice = calculateUnitPrice(basePrice, options);

        set((state) => {
            const existingItemIndex = state.items.findIndex(
                (item) => item.id === cartItemId
            );
            let newItems: CartItem[];

            if (existingItemIndex !== -1) {
                newItems = state.items.map((item, index) => {
                    if (index === existingItemIndex) {
                        const newQuantity = item.quantity + quantity;
                        return {
                            ...item,
                            quantity: newQuantity,
                            totalPrice: item.unitPrice * newQuantity,
                        };
                    }
                    return item;
                });
            } else {
                const newItem: CartItem = {
                    id: cartItemId,
                    menuId,
                    menuName,
                    unitPrice,
                    quantity,
                    totalPrice: unitPrice * quantity,
                    options,
                    imageUrl,
                };
                newItems = [...state.items, newItem];
            }

            return {
                items: newItems,
                totalPrice: calculateTotalPrice(newItems),
                totalQuantity: calculateTotalQuantity(newItems),
            };
        });
    },

    removeItem: (cartItemId) => {
        set((state) => {
            const newItems = state.items.filter((item) => item.id !== cartItemId);
            return {
                items: newItems,
                totalPrice: calculateTotalPrice(newItems),
                totalQuantity: calculateTotalQuantity(newItems),
            };
        });
    },

    updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(cartItemId);
            return;
        }

        set((state) => {
            const newItems = state.items.map((item) => {
                if (item.id === cartItemId) {
                    return {
                        ...item,
                        quantity,
                        totalPrice: item.unitPrice * quantity,
                    };
                }
                return item;
            });

            return {
                items: newItems,
                totalPrice: calculateTotalPrice(newItems),
                totalQuantity: calculateTotalQuantity(newItems),
            };
        });
    },

    clearCart: () => {
        set({
            items: [],
            totalPrice: 0,
            totalQuantity: 0,
        });
    },

    getItemById: (cartItemId) => {
        return get().items.find((item) => item.id === cartItemId);
    },
}));
