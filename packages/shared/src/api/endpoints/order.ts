import type { CancelOrderRequest, CreateOrderRequest, Order, OrderChannel, OrderListResponse, OrderStatus, OrderDelivery, OrderPayment, UpdateDeliveryStatusRequest } from '../../types';
import type { OrderResponse } from '../../types';
import { apiClient } from '../client';

interface BackendOrderItem {
    id: string;
    orderId: string;
    menuId: string;
    menuName: string;
    menuPrice: number;
    quantity: number;
    totalPrice: number;
    selectedOptions?: {
        id: string;
        menuOptionId?: string | null;
        optionName: string;
        optionPrice: number;
        optionGroupName: string;
    }[];
    createdAt?: string;
    updatedAt?: string;
}

interface BackendOrder {
    id: string;
    orderNumber: string;
    tableNumber?: number | null;
    storeId: string;
    userId?: string | null;
    type?: string;
    source?: OrderChannel;
    status: OrderStatus;
    paymentStatus?: string;
    totalAmount: number;
    tossOrderId?: string | null;
    note?: string | null;
    items?: BackendOrderItem[];
    delivery?: OrderDelivery | null;
    payments?: OrderPayment[];
    createdAt: string;
    updatedAt?: string;
    completedAt?: string | null;
    cancelledAt?: string | null;
    cancelReason?: string | null;
}

function mapOrder(order: BackendOrder): Order {
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        tableId: null,
        tableNumber: order.tableNumber,
        storeId: order.storeId,
        userId: order.userId,
        type: order.type,
        source: order.source,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        totalPrice: order.totalAmount,
        tossOrderId: order.tossOrderId,
        note: order.note,
        delivery: order.delivery,
        payments: order.payments || [],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        completedAt: order.completedAt,
        cancelledAt: order.cancelledAt,
        cancelReason: order.cancelReason,
        items: (order.items || []).map((item) => ({
            id: item.id,
            orderId: item.orderId,
            menuId: item.menuId,
            menuName: item.menuName,
            quantity: item.quantity,
            unitPrice: item.menuPrice,
            totalPrice: item.totalPrice,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            options: item.selectedOptions?.map((option) => ({
                optionGroupId: option.menuOptionId || option.id,
                optionGroupName: option.optionGroupName,
                items: [{
                    optionItemId: option.menuOptionId || option.id,
                    name: option.optionName,
                    price: option.optionPrice,
                }],
            })),
        })),
    };
}

export async function getOrdersByTable(
    tableNumber: number,
    storeId = process.env.NEXT_PUBLIC_STORE_ID || 'store-1'
): Promise<Order[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    const sessionResponse = await fetch(`${API_URL}/stores/${storeId}/tables/${tableNumber}/current-session`);
    const sessionData = await sessionResponse.json();

    if (!sessionData.data) {
        return [];
    }

    const sessionId = sessionData.data.id;
    const ordersResponse = await fetch(`${API_URL}/stores/${storeId}/orders?sessionId=${sessionId}`);
    const ordersData = await ordersResponse.json();

    return (ordersData.data || []).map(mapOrder);
}

export async function createOrder(
    request: CreateOrderRequest
): Promise<OrderResponse> {
    return apiClient.post<OrderResponse>('/orders', request);
}

export async function getDeliveryOrders(params: {
    storeId?: string | null;
    page?: number;
}): Promise<OrderListResponse> {
    const searchParams = new URLSearchParams();
    if (params.storeId) searchParams.set('storeId', params.storeId);
    if (params.page) searchParams.set('page', String(params.page));

    const response = await apiClient.get<BackendOrder[] | {
        data: BackendOrder[];
        meta?: {
            total?: number;
            page?: number;
        };
    }>(`/orders?${searchParams.toString()}`);
    const orders = Array.isArray(response) ? response : response.data;

    return {
        orders: orders.map(mapOrder),
        total: Array.isArray(response) ? response.length : response.meta?.total || orders.length,
        page: Array.isArray(response) ? params.page || 1 : response.meta?.page || params.page || 1,
        limit: 20,
    };
}

export async function getOrder(orderId: string): Promise<Order> {
    const response = await apiClient.get<BackendOrder>(`/orders/${orderId}`);
    return mapOrder(response);
}

export async function cancelOrder(
    orderId: string,
    request: CancelOrderRequest = {}
): Promise<Order> {
    const response = await apiClient.patch<BackendOrder>(`/orders/${orderId}/cancel`, request);
    return mapOrder(response);
}

export async function updateDeliveryStatus(
    storeId: string,
    orderId: string,
    request: UpdateDeliveryStatusRequest
): Promise<Order> {
    const response = await apiClient.patch<BackendOrder>(
        `/stores/${storeId}/orders/${orderId}/delivery-status`,
        request
    );
    return mapOrder(response);
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
