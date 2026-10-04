/**
 * 가게 요청사항(order.note).
 * 예전 배달 주문은 배달 요청사항을 note에도 그대로 복사해 저장했으므로, 같은 값이면 가게 요청이 없는 것으로 본다.
 */
export function getStoreRequest(order: { note?: string | null; delivery?: { deliveryMemo?: string | null } | null }): string | null {
  const note = order.note?.trim();
  if (!note || note === order.delivery?.deliveryMemo?.trim()) return null;
  return note;
}
