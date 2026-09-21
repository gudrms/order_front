import { beforeEach, describe, expect, it } from 'vitest';
import type { CartSelectedOption } from '@order/shared';
import { useCartStore } from './cartStore';

const taco = {
    menuId: 'menu-taco',
    menuName: '오리지널 쇠고기 타코(2pcs)',
    basePrice: 11000,
    quantity: 1,
};

const mango: CartSelectedOption = {
    id: 'sel-mango',
    groupName: '맛 선택',
    itemId: 'opt-mango',
    itemName: '망고',
    price: 0,
};
const large: CartSelectedOption = {
    id: 'sel-large',
    groupName: '사이즈',
    itemId: 'opt-large',
    itemName: '라지',
    price: 500,
};

function cart() {
    return useCartStore.getState();
}

describe('cartStore', () => {
    beforeEach(() => {
        useCartStore.setState({ items: [], totalPrice: 0, totalQuantity: 0 });
    });

    describe('addItem', () => {
        it('옵션이 없으면 기본 가격으로 담고 합계를 갱신한다', () => {
            cart().addItem({ ...taco, quantity: 2 });

            const { items, totalPrice, totalQuantity } = cart();
            expect(items).toHaveLength(1);
            expect(items[0]).toMatchObject({
                menuId: 'menu-taco',
                unitPrice: 11000,
                quantity: 2,
                totalPrice: 22000,
            });
            expect(totalPrice).toBe(22000);
            expect(totalQuantity).toBe(2);
        });

        it('옵션 가격을 기본 가격에 더해 개당 가격을 만든다', () => {
            cart().addItem({ ...taco, options: [mango, large] });

            expect(cart().items[0]).toMatchObject({ unitPrice: 11500, totalPrice: 11500 });
        });

        it('같은 메뉴·같은 옵션을 다시 담으면 수량만 늘린다', () => {
            cart().addItem({ ...taco, options: [mango] });
            cart().addItem({ ...taco, options: [mango], quantity: 2 });

            expect(cart().items).toHaveLength(1);
            expect(cart().items[0]).toMatchObject({ quantity: 3, totalPrice: 33000 });
            expect(cart().totalQuantity).toBe(3);
        });

        it('옵션 순서만 다르면 같은 항목으로 합친다', () => {
            // 항목 ID를 옵션 ID 정렬로 만들기 때문이다. 정렬을 빼면 같은 구성이 두 줄로 쌓인다.
            cart().addItem({ ...taco, options: [mango, large] });
            cart().addItem({ ...taco, options: [large, mango] });

            expect(cart().items).toHaveLength(1);
            expect(cart().items[0].quantity).toBe(2);
        });

        it('옵션 구성이 다르면 별도 항목으로 담는다', () => {
            cart().addItem({ ...taco, options: [mango] });
            cart().addItem({ ...taco, options: [large] });

            expect(cart().items).toHaveLength(2);
            expect(cart().totalQuantity).toBe(2);
            expect(cart().totalPrice).toBe(11000 + 11500);
        });

        it('옵션 없는 항목과 옵션 있는 항목은 섞이지 않는다', () => {
            cart().addItem(taco);
            cart().addItem({ ...taco, options: [large] });

            expect(cart().items).toHaveLength(2);
        });
    });

    describe('updateQuantity', () => {
        it('수량을 바꾸면 항목 합계와 전체 합계가 함께 갱신된다', () => {
            cart().addItem({ ...taco, options: [large] });
            const id = cart().items[0].id;

            cart().updateQuantity(id, 3);

            expect(cart().items[0]).toMatchObject({ quantity: 3, totalPrice: 34500 });
            expect(cart().totalPrice).toBe(34500);
            expect(cart().totalQuantity).toBe(3);
        });

        it('수량을 0 이하로 내리면 항목을 뺀다', () => {
            cart().addItem(taco);
            const id = cart().items[0].id;

            cart().updateQuantity(id, 0);

            expect(cart().items).toHaveLength(0);
            expect(cart().totalPrice).toBe(0);
            expect(cart().totalQuantity).toBe(0);
        });
    });

    describe('removeItem', () => {
        it('항목을 빼면 남은 항목으로 합계를 다시 계산한다', () => {
            cart().addItem(taco);
            cart().addItem({ ...taco, menuId: 'menu-quesadilla', basePrice: 12000 });
            const tacoId = cart().items[0].id;

            cart().removeItem(tacoId);

            expect(cart().items).toHaveLength(1);
            expect(cart().totalPrice).toBe(12000);
            expect(cart().totalQuantity).toBe(1);
        });

        it('없는 ID를 빼도 장바구니가 변하지 않는다', () => {
            cart().addItem(taco);

            cart().removeItem('menu_does-not-exist');

            expect(cart().items).toHaveLength(1);
            expect(cart().totalPrice).toBe(11000);
        });
    });

    describe('clearCart', () => {
        it('전부 비우고 합계를 0으로 되돌린다', () => {
            cart().addItem({ ...taco, quantity: 2 });
            cart().addItem({ ...taco, menuId: 'menu-quesadilla', basePrice: 12000 });

            cart().clearCart();

            expect(cart().items).toHaveLength(0);
            expect(cart().totalPrice).toBe(0);
            expect(cart().totalQuantity).toBe(0);
        });
    });
});
