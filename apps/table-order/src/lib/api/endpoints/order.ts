import type { CartSelectedOption } from '@order/shared';
import { apiClient } from '../client';

export type OrderStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'COOKING'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItemInput {
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: CartSelectedOption[];
}

export interface CreateOrderRequest {
  tableNumber: number;
  items: OrderItemInput[];
  totalAmount: number;
}

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
  createdAt: string;
  sessionId?: string;
}

export interface OrderItem extends OrderItemInput {
  id: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  okposOrderId?: string;
}

interface BackendSelectedOption {
  id: string;
  menuOptionId?: string | null;
  optionName: string;
  optionPrice: number;
  optionGroupName: string;
}

interface BackendOrderItem {
  id: string;
  menuId: string;
  menuName: string;
  menuPrice: number;
  quantity: number;
  totalPrice: number;
  selectedOptions?: BackendSelectedOption[];
  options?: CartSelectedOption[];
}

interface BackendOrder {
  id: string;
  orderNumber: string;
  tableNumber: number;
  status: OrderStatus;
  totalAmount: number;
  items?: BackendOrderItem[];
  createdAt: string;
  okposOrderId?: string;
}

interface CurrentSessionResponse {
  id: string;
  orders?: BackendOrder[];
}

interface FirstOrderResponse {
  session: CurrentSessionResponse;
  order: BackendOrder;
}

function mapSelectedOptions(options?: BackendSelectedOption[]): CartSelectedOption[] | undefined {
  if (!options?.length) return undefined;

  return options.map((option) => ({
    id: option.menuOptionId || option.id,
    groupName: option.optionGroupName,
    itemId: option.menuOptionId || option.id,
    itemName: option.optionName,
    price: option.optionPrice,
  }));
}

function mapOrder(order: BackendOrder): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    okposOrderId: order.okposOrderId,
    items: (order.items || []).map((item) => ({
      id: item.id,
      menuId: item.menuId,
      menuName: item.menuName,
      quantity: item.quantity,
      unitPrice: item.menuPrice,
      totalPrice: item.totalPrice,
      options: item.options || mapSelectedOptions(item.selectedOptions),
    })),
  };
}

function toBackendOrderPayload(request: CreateOrderRequest) {
  return {
    tableNumber: request.tableNumber,
    totalAmount: request.totalAmount,
    items: request.items.map((item) => ({
      menuId: item.menuId,
      menuName: item.menuName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      options: item.options?.map((option) => ({
        optionId: option.itemId,
      })),
    })),
  };
}

export async function createOrder(
  request: CreateOrderRequest,
  storeId: string
): Promise<CreateOrderResponse> {
  const currentSession = await apiClient.get<CurrentSessionResponse | null>(
    `/stores/${storeId}/tables/${request.tableNumber}/current-session`
  );
  const payload = toBackendOrderPayload(request);

  if (currentSession?.id) {
    const order = await apiClient.post<BackendOrder>(
      `/stores/${storeId}/orders/${currentSession.id}`,
      payload
    );

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      sessionId: currentSession.id,
    };
  }

  const result = await apiClient.post<FirstOrderResponse>(
    `/stores/${storeId}/orders/first`,
    payload
  );

  return {
    id: result.order.id,
    orderNumber: result.order.orderNumber,
    createdAt: result.order.createdAt,
    sessionId: result.session.id,
  };
}

export async function getOrdersByTable(
  tableNumber: number,
  storeId: string
): Promise<Order[]> {
  const session = await apiClient.get<CurrentSessionResponse | null>(
    `/stores/${storeId}/tables/${tableNumber}/current-session`
  );

  return (session?.orders || []).map(mapOrder);
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus
): Promise<Order | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const stored = localStorage.getItem(`order_${orderNumber}`);
  if (!stored) {
    return null;
  }

  const order: Order = JSON.parse(stored);
  order.status = status;

  localStorage.setItem(`order_${orderNumber}`, JSON.stringify(order));

  return order;
}
