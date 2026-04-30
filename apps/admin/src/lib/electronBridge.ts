import type { AdminOrderAlertPayload } from '@/lib/adminOrderAlerts';

export type ElectronPrintReceiptPayload = {
  orderId: string;
  orderNumber?: string;
  silent?: boolean;
};

export type ElectronPrintResult = {
  success: boolean;
  message?: string;
};

export type AdminElectronBridge = {
  isElectron?: boolean;
  notifyNewOrder?: (payload: AdminOrderAlertPayload) => void | Promise<void>;
  playNewOrderSound?: () => void | Promise<void>;
  printReceipt?: (payload: ElectronPrintReceiptPayload) => void | ElectronPrintResult | Promise<void | ElectronPrintResult>;
};

export function getAdminElectronBridge() {
  if (typeof window === 'undefined') return undefined;
  return window.adminElectron;
}

export function isAdminElectronRuntime() {
  return !!getAdminElectronBridge()?.isElectron;
}

declare global {
  interface Window {
    adminElectron?: AdminElectronBridge;
  }
}
