import { describe, expect, it } from 'vitest';
import { cartItemIdsForMenu, getUnavailableMenuId } from './orderError';

/** ApiClientError는 응답 본문을 `data`에 그대로 담는다. (packages/shared/src/api/client.ts) */
function apiError(data: unknown) {
    return Object.assign(new Error('주문 실패'), { data });
}

describe('getUnavailableMenuId', () => {
    it('MENU_UNAVAILABLE 응답에서 menuId를 꺼낸다', () => {
        const error = apiError({
            statusCode: 400,
            code: 'MENU_UNAVAILABLE',
            message: '품절되었거나 판매하지 않는 메뉴입니다: 쇠고기 케사디야',
            menuId: 'menu-quesadilla',
        });

        expect(getUnavailableMenuId(error)).toBe('menu-quesadilla');
    });

    it('삭제된 메뉴(404)도 같은 코드라 동일하게 처리한다', () => {
        // 서버가 품절과 삭제를 같은 code로 내려준다. 고객 입장에서는 같은 막다른 길이다.
        const error = apiError({
            statusCode: 404,
            code: 'MENU_UNAVAILABLE',
            message: '판매하지 않는 메뉴가 담겨 있습니다. 메뉴가 변경되었을 수 있습니다',
            menuId: 'menu-gone',
        });

        expect(getUnavailableMenuId(error)).toBe('menu-gone');
    });

    it('다른 코드의 오류는 장바구니를 건드리지 않는다', () => {
        const error = apiError({
            statusCode: 400,
            code: 'BELOW_MINIMUM_ORDER',
            message: '최소 주문금액 10,000원 이상부터 주문할 수 있습니다',
            menuId: 'menu-taco',
        });

        expect(getUnavailableMenuId(error)).toBeNull();
    });

    it('code는 맞지만 menuId가 없으면 null — 어느 메뉴를 뺄지 모른다', () => {
        expect(getUnavailableMenuId(apiError({ code: 'MENU_UNAVAILABLE' }))).toBeNull();
        expect(getUnavailableMenuId(apiError({ code: 'MENU_UNAVAILABLE', menuId: '' }))).toBeNull();
    });

    it('구조화되지 않은 오류에도 터지지 않는다', () => {
        expect(getUnavailableMenuId(new Error('network'))).toBeNull();
        expect(getUnavailableMenuId(null)).toBeNull();
        expect(getUnavailableMenuId(undefined)).toBeNull();
        expect(getUnavailableMenuId('boom')).toBeNull();
        expect(getUnavailableMenuId(apiError(null))).toBeNull();
        expect(getUnavailableMenuId(apiError('plain text body'))).toBeNull();
    });
});

describe('cartItemIdsForMenu', () => {
    // 옵션 조합마다 항목이 따로 생긴다. (cartStore가 항목 ID를 메뉴 ID + 옵션 조합으로 만든다)
    const items = [
        { id: 'menu_jarritos_opt_mango', menuId: 'menu-jarritos' },
        { id: 'menu_jarritos_opt_lime', menuId: 'menu-jarritos' },
        { id: 'menu_taco', menuId: 'menu-taco' },
    ];

    it('같은 메뉴의 옵션 조합을 전부 돌려준다', () => {
        // 하나만 빼면 나머지가 남아 다시 주문할 때 같은 자리에서 막힌다.
        expect(cartItemIdsForMenu(items, 'menu-jarritos')).toEqual([
            'menu_jarritos_opt_mango',
            'menu_jarritos_opt_lime',
        ]);
    });

    it('다른 메뉴는 남긴다', () => {
        expect(cartItemIdsForMenu(items, 'menu-taco')).toEqual(['menu_taco']);
    });

    it('장바구니에 없는 메뉴면 빈 배열', () => {
        expect(cartItemIdsForMenu(items, 'menu-not-in-cart')).toEqual([]);
        expect(cartItemIdsForMenu([], 'menu-taco')).toEqual([]);
    });
});
