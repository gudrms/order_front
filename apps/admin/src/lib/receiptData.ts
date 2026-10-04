import type { Order } from '@order/shared';

/**
 * PC 앱에 넘기는 주문서 내용 (apps/admin-electron/src/receipt.ts의 ReceiptData와 같은 모양).
 * PC 앱이 COM 포트로 직접 출력할 때 이걸 영수증 프린터 명령으로 바꾼다.
 * 받는 분 이름은 배달에 필요 없어 넣지 않는다.
 */
export type ReceiptData = {
  orderNumber: string;
  createdAt: string;
  isDelivery: boolean;
  tableNumber?: number | null;
  estimatedMinutes?: number | null;
  address?: string;
  phone?: string;
  request?: string;
  items: { name: string; quantity: number; totalPrice: number; options: string[] }[];
  deliveryFee?: number | null;
  total: number;
};

export function buildReceiptData(order: Order): ReceiptData {
  const delivery = order.delivery;
  return {
    orderNumber: order.orderNumber,
    createdAt: new Date(order.createdAt).toISOString(),
    isDelivery: order.type === 'DELIVERY' || !!delivery,
    tableNumber: order.tableNumber ?? null,
    estimatedMinutes: delivery?.estimatedMinutes ?? null,
    address: delivery ? `${delivery.address}${delivery.detailAddress ? ` ${delivery.detailAddress}` : ''}` : undefined,
    phone: delivery?.recipientPhone,
    request: delivery?.deliveryMemo || order.note || undefined,
    items: order.items.map((item) => ({
      name: item.menuName,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      options: (item.options ?? []).flatMap((group) =>
        group.items.map((option) =>
          `${group.optionGroupName}: ${option.name}${option.price > 0 ? ` (+${option.price.toLocaleString('ko-KR')}원)` : ''}`,
        ),
      ),
    })),
    deliveryFee: delivery?.deliveryFee ?? null,
    total: order.totalAmount ?? order.totalPrice,
  };
}
