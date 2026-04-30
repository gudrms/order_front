export type AdminOrderAlertPayload = {
  storeId: string;
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
};

export const ADMIN_ORDER_ALERT_EVENT = 'admin:new-order';

export function emitAdminOrderAlert(payload: AdminOrderAlertPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AdminOrderAlertPayload>(ADMIN_ORDER_ALERT_EVENT, {
    detail: payload,
  }));
}
