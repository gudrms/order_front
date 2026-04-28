import type { CreateDeliveryOrderRequest } from './payment';

export type OrderStatus = 'PENDING' | 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'COOKING' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

export interface SelectedOptionItem {
  optionItemId: string;
  name: string;
  price: number;
}

export interface SelectedOption {
  optionGroupId: string;
  optionGroupName: string;
  items: SelectedOptionItem[];
}

export interface CartSelectedOption {
  id: string;
  groupName: string;
  itemId: string;
  itemName: string;
  price: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: SelectedOption[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface OrderDelivery {
  id: string;
  addressId?: string | null;
  recipientName: string;
  recipientPhone: string;
  address: string;
  detailAddress?: string | null;
  zipCode?: string | null;
  deliveryMemo?: string | null;
  deliveryFee: number;
  status: string;
  estimatedMinutes?: number | null;
}

export interface OrderPayment {
  id: string;
  provider: string;
  method: string;
  status: string;
  amount: number;
  approvedAmount?: number | null;
  receiptUrl?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string | null;
  tableNumber?: number | null;
  storeId: string;
  userId?: string | null;
  type?: string;
  source?: string;
  items: OrderItem[];
  delivery?: OrderDelivery | null;
  payments?: OrderPayment[];
  totalPrice: number;
  totalAmount: number;
  paymentStatus?: string;
  status: OrderStatus;
  tossOrderId?: string | null;
  note?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  completedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  cancelReason?: string | null;
}

export interface CreateTableOrderRequest {
  tableId: string;
  storeId: string;
  items: {
    menuId: string;
    quantity: number;
    options?: {
      optionGroupId: string;
      optionItemIds: string[];
    }[];
  }[];
}

export type CreateOrderRequest = CreateTableOrderRequest | CreateDeliveryOrderRequest;

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}
