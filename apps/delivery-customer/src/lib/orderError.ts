/**
 * 주문 생성이 거절됐을 때 클라이언트가 장바구니를 정리하기 위한 규칙.
 *
 * 서버는 주문할 수 없는 메뉴를 `code: 'MENU_UNAVAILABLE'`과 `menuId`로 알려준다.
 * (`apps/backend/src/modules/orders/order-helpers.ts` — 품절·비활성·숨김·삭제 모두 같은 코드)
 * 이 계약이 어긋나면 안내만 뜨고 장바구니가 그대로라, 고객이 다시 눌러도 같은 자리에서 막힌다.
 */

/** 주문 불가로 거절된 메뉴 ID. 해당 오류가 아니면 null. */
export function getUnavailableMenuId(error: unknown): string | null {
    if (!error || typeof error !== 'object') return null;

    const data = (error as { data?: { code?: string; menuId?: string } }).data;

    return data?.code === 'MENU_UNAVAILABLE' && data.menuId ? data.menuId : null;
}

/**
 * 한 메뉴에 해당하는 장바구니 항목 ID 전부.
 *
 * 옵션 조합마다 항목이 따로 생기므로(`cartStore`의 항목 ID가 메뉴 ID + 옵션 조합이다)
 * 같은 메뉴라도 여러 줄일 수 있다. 하나만 빼면 나머지가 남아 다시 막힌다.
 */
export function cartItemIdsForMenu(
    items: readonly { id: string; menuId: string }[],
    menuId: string,
): string[] {
    return items.filter((item) => item.menuId === menuId).map((item) => item.id);
}
