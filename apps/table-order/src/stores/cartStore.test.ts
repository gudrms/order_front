/**
 * cartStore 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';
import type { AddCartItemInput } from './cartStore';

describe('cartStore', () => {
  beforeEach(() => {
    // 각 테스트 전에 장바구니 초기화
    useCartStore.getState().clearCart();
  });

  describe('addItem', () => {
    it('옵션 없는 메뉴를 장바구니에 추가할 수 있다', () => {
      const input: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 1,
      };

      useCartStore.getState().addItem(input);

      const { items, totalPrice, totalQuantity } = useCartStore.getState();

      expect(items).toHaveLength(1);
      expect(items[0].menuName).toBe('후라이드 치킨');
      expect(items[0].unitPrice).toBe(18000);
      expect(items[0].totalPrice).toBe(18000);
      expect(totalPrice).toBe(18000);
      expect(totalQuantity).toBe(1);
    });

    it('옵션 있는 메뉴를 장바구니에 추가할 수 있다', () => {
      const input: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 2,
        options: [
          {
            id: 'opt-1',
            groupName: '사이즈',
            itemId: 'opt-item-2',
            itemName: '2인분',
            price: 5000,
          },
        ],
      };

      useCartStore.getState().addItem(input);

      const { items } = useCartStore.getState();

      expect(items[0].unitPrice).toBe(23000); // 18000 + 5000
      expect(items[0].totalPrice).toBe(46000); // 23000 * 2
      expect(items[0].options).toHaveLength(1);
    });

    it('같은 메뉴를 다시 추가하면 수량이 증가한다', () => {
      const input: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 1,
      };

      useCartStore.getState().addItem(input);
      useCartStore.getState().addItem(input);

      const { items, totalQuantity } = useCartStore.getState();

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
      expect(totalQuantity).toBe(2);
    });

    it('다른 옵션을 선택한 같은 메뉴는 별도 아이템으로 추가된다', () => {
      const input1: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 1,
        options: [
          {
            id: 'opt-1',
            groupName: '사이즈',
            itemId: 'opt-item-1',
            itemName: '1인분',
            price: 0,
          },
        ],
      };

      const input2: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 1,
        options: [
          {
            id: 'opt-1',
            groupName: '사이즈',
            itemId: 'opt-item-2',
            itemName: '2인분',
            price: 5000,
          },
        ],
      };

      useCartStore.getState().addItem(input1);
      useCartStore.getState().addItem(input2);

      const { items } = useCartStore.getState();

      expect(items).toHaveLength(2);
      expect(items[0].unitPrice).toBe(18000);
      expect(items[1].unitPrice).toBe(23000);
    });

    it('여러 옵션이 있는 메뉴를 추가할 수 있다', () => {
      const input: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440002',
        menuName: '페퍼로니 피자',
        basePrice: 22000,
        quantity: 1,
        options: [
          {
            id: 'opt-2',
            groupName: '사이즈',
            itemId: 'opt-item-5',
            itemName: 'L (Large)',
            price: 5000,
          },
          {
            id: 'opt-3',
            groupName: '추가 토핑',
            itemId: 'opt-item-6',
            itemName: '치즈 추가',
            price: 2000,
          },
          {
            id: 'opt-3',
            groupName: '추가 토핑',
            itemId: 'opt-item-7',
            itemName: '페퍼로니 추가',
            price: 3000,
          },
        ],
      };

      useCartStore.getState().addItem(input);

      const { items } = useCartStore.getState();

      expect(items[0].unitPrice).toBe(32000); // 22000 + 5000 + 2000 + 3000
      expect(items[0].options).toHaveLength(3);
    });
  });

  describe('removeItem', () => {
    it('장바구니에서 아이템을 삭제할 수 있다', () => {
      const input: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 1,
      };

      useCartStore.getState().addItem(input);
      const { items } = useCartStore.getState();
      const itemId = items[0].id;

      useCartStore.getState().removeItem(itemId);

      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().totalPrice).toBe(0);
      expect(useCartStore.getState().totalQuantity).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    it('아이템의 수량을 변경할 수 있다', () => {
      const input: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 1,
      };

      useCartStore.getState().addItem(input);
      const { items } = useCartStore.getState();
      const itemId = items[0].id;

      useCartStore.getState().updateQuantity(itemId, 3);

      const updatedState = useCartStore.getState();

      expect(updatedState.items[0].quantity).toBe(3);
      expect(updatedState.items[0].totalPrice).toBe(54000); // 18000 * 3
      expect(updatedState.totalPrice).toBe(54000);
      expect(updatedState.totalQuantity).toBe(3);
    });

    it('수량을 0으로 변경하면 아이템이 삭제된다', () => {
      const input: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 1,
      };

      useCartStore.getState().addItem(input);
      const { items } = useCartStore.getState();
      const itemId = items[0].id;

      useCartStore.getState().updateQuantity(itemId, 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('음수 수량으로 변경하면 아이템이 삭제된다', () => {
      const input: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 2,
      };

      useCartStore.getState().addItem(input);
      const { items } = useCartStore.getState();
      const itemId = items[0].id;

      useCartStore.getState().updateQuantity(itemId, -5);

      // 음수는 0 이하로 처리되어 아이템 삭제
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('장바구니의 모든 아이템을 삭제할 수 있다', () => {
      const input1: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 1,
      };

      const input2: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440002',
        menuName: '페퍼로니 피자',
        basePrice: 22000,
        quantity: 2,
      };

      useCartStore.getState().addItem(input1);
      useCartStore.getState().addItem(input2);

      expect(useCartStore.getState().items).toHaveLength(2);

      useCartStore.getState().clearCart();

      const state = useCartStore.getState();

      expect(state.items).toHaveLength(0);
      expect(state.totalPrice).toBe(0);
      expect(state.totalQuantity).toBe(0);
    });
  });

  describe('총액 계산', () => {
    it('여러 아이템의 총액이 정확하게 계산된다', () => {
      const input1: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 2,
      };

      const input2: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440002',
        menuName: '페퍼로니 피자',
        basePrice: 22000,
        quantity: 1,
        options: [
          {
            id: 'opt-3',
            groupName: '추가 토핑',
            itemId: 'opt-item-6',
            itemName: '치즈 추가',
            price: 2000,
          },
        ],
      };

      useCartStore.getState().addItem(input1);
      useCartStore.getState().addItem(input2);

      const { totalPrice, totalQuantity } = useCartStore.getState();

      expect(totalPrice).toBe(60000); // (18000 * 2) + (22000 + 2000)
      expect(totalQuantity).toBe(3); // 2 + 1
    });
  });

  describe('getItemById', () => {
    it('ID로 아이템을 조회할 수 있다', () => {
      const input: AddCartItemInput = {
        menuId: '550e8400-e29b-41d4-a716-446655440001',
        menuName: '후라이드 치킨',
        basePrice: 18000,
        quantity: 1,
      };

      useCartStore.getState().addItem(input);
      const { items } = useCartStore.getState();
      const itemId = items[0].id;

      const found = useCartStore.getState().getItemById(itemId);

      expect(found).toBeDefined();
      expect(found?.menuName).toBe('후라이드 치킨');
    });

    it('존재하지 않는 ID는 undefined를 반환한다', () => {
      const found = useCartStore.getState().getItemById('non-existent-id');

      expect(found).toBeUndefined();
    });
  });
});
