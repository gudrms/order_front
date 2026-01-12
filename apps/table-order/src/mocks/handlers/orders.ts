/**
 * MSW Handlers - Orders API
 */

import { http, HttpResponse } from 'msw';
import type { CreateOrderRequest } from '@/lib/api/endpoints/order';
import { createMockSession, findActiveSession, updateSessionTotal, addOrderToSession } from './sessions';
import { DOMAINS } from '@/lib/constants/domains';

const API_BASE = DOMAINS.API;

// 임시 주문 저장소
const orders: any[] = [];
let orderCounter = 1;

export const ordersHandlers = [
  // POST /api/v1/stores/:storeId/orders/first (첫 주문 - 세션 시작)
  http.post(`${API_BASE}/stores/:storeId/orders/first`, async ({ request, params }) => {
    console.log('[MSW] Create first order (start session):', params);
    const body = await request.json() as CreateOrderRequest;
    const { storeId } = params;

    // 1. 세션 시작 (기존 세션 없으면 생성)
    let session = findActiveSession(storeId as string, body.tableNumber);
    if (!session) {
      session = createMockSession(storeId as string, body.tableNumber);
    }

    // 2. 주문 생성
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orderCounter++).padStart(3, '0')}`;
    const totalAmount = body.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    const newOrder = {
      id: crypto.randomUUID(),
      orderNumber,
      storeId: storeId,
      sessionId: session.id,
      tableNumber: body.tableNumber,
      status: 'PENDING',
      totalAmount,
      items: body.items.map((item) => ({
        id: crypto.randomUUID(),
        menuId: item.menuId,
        menuName: item.menuName || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        options: item.options,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(newOrder);

    // 3. 세션 총액 업데이트
    updateSessionTotal(session.id, totalAmount);
    addOrderToSession(session.id, newOrder);

    // 1초 지연 (실제 API 호출 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return HttpResponse.json({
      data: {
        session,
        order: newOrder,
      },
    });
  }),

  // POST /api/v1/stores/:storeId/orders/:sessionId (추가 주문)
  http.post(`${API_BASE}/stores/:storeId/orders/:sessionId`, async ({ request, params }) => {
    console.log('[MSW] Create additional order:', params);
    const body = await request.json() as CreateOrderRequest;
    const { storeId, sessionId } = params;

    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orderCounter++).padStart(3, '0')}`;
    const totalAmount = body.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    const newOrder = {
      id: crypto.randomUUID(),
      orderNumber,
      storeId,
      sessionId,
      tableNumber: body.tableNumber,
      status: 'PENDING',
      totalAmount,
      items: body.items.map((item) => ({
        id: crypto.randomUUID(),
        menuId: item.menuId,
        menuName: item.menuName || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        options: item.options,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(newOrder);

    // 세션 총액 업데이트
    updateSessionTotal(sessionId as string, totalAmount);
    addOrderToSession(sessionId as string, newOrder);

    // 1초 지연
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return HttpResponse.json({
      data: newOrder,
    });
  }),

  // GET /api/v1/stores/:storeId/orders (관리자용)
  http.get(`${API_BASE}/stores/:storeId/orders`, ({ request, params }) => {
    console.log('[MSW] Get orders request:', params);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    let filteredOrders = orders.filter((o) => o.storeId === params.storeId);

    if (sessionId) {
      filteredOrders = filteredOrders.filter((o) => o.sessionId === sessionId);
      console.log(`[MSW] 주문 조회 - Session ${sessionId}:`, filteredOrders.length, '건');
    } else {
      console.log('[MSW] 전체 주문 조회:', filteredOrders.length, '건');
    }

    return HttpResponse.json({
      data: filteredOrders,
    });
  }),
];
