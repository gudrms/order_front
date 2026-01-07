/**
 * MSW Handlers - Sessions API
 */

import { http, HttpResponse } from 'msw';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// 임시 세션 저장소
const sessions: any[] = [];
let sessionCounter = 1;

export const sessionsHandlers = [
  // GET /api/v1/stores/:storeId/tables/:tableNumber/current-session
  http.get(`${API_BASE}/stores/:storeId/tables/:tableNumber/current-session`, ({ params }) => {
    const { storeId, tableNumber } = params;
    console.log('[MSW] Get current session:', { storeId, tableNumber });

    // 현재 활성 세션 찾기
    const activeSession = sessions.find(
      (s) => s.storeId === storeId && s.tableNumber === parseInt(tableNumber as string) && s.status === 'ACTIVE'
    );

    return HttpResponse.json({
      data: activeSession || null,
    });
  }),

  // GET /api/v1/stores/:storeId/sessions/:sessionId
  http.get(`${API_BASE}/stores/:storeId/sessions/:sessionId`, ({ params }) => {
    const { sessionId } = params;
    console.log('[MSW] Get session by ID:', sessionId);

    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      return HttpResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      data: session,
    });
  }),

  // POST /api/v1/stores/:storeId/sessions/:sessionId/complete
  http.post(`${API_BASE}/stores/:storeId/sessions/:sessionId/complete`, async ({ params, request }) => {
    const { storeId, sessionId } = params;
    const body = await request.json() as any;

    console.log('[MSW] Complete session:', { sessionId, body });

    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      return HttpResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Guest 처리 (전화번호 있으면)
    let guest = null;
    if (body.guestPhone) {
      guest = {
        id: crypto.randomUUID(),
        phoneNumber: body.guestPhone,
        name: body.guestName || null,
        visitCount: 1,
        totalSpent: session.totalAmount,
        lastVisitedAt: new Date().toISOString(),
      };
    }

    // 세션 업데이트
    session.status = 'COMPLETED';
    session.endedAt = new Date().toISOString();
    session.guestCount = body.guestCount;
    session.guest = guest;

    return HttpResponse.json({
      data: session,
    });
  }),

  // POST /api/v1/stores/:storeId/tables/:tableNumber/reset (테스트용)
  http.post(`${API_BASE}/stores/:storeId/tables/:tableNumber/reset`, ({ params }) => {
    const { storeId, tableNumber } = params;
    console.log('[MSW] Reset table session:', { storeId, tableNumber });

    // 현재 활성 세션 찾기
    const activeSession = sessions.find(
      (s) => s.storeId === storeId && s.tableNumber === parseInt(tableNumber as string) && s.status === 'ACTIVE'
    );

    if (!activeSession) {
      return HttpResponse.json({
        data: null,
        message: 'No active session',
      });
    }

    // 세션 강제 종료
    activeSession.status = 'COMPLETED';
    activeSession.endedAt = new Date().toISOString();
    activeSession.guestCount = 1;

    return HttpResponse.json({
      data: activeSession,
      message: 'Session reset successfully',
    });
  }),
];

// 세션 생성 헬퍼 (orders 핸들러에서 사용)
export function createMockSession(storeId: string, tableNumber: number) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sessionNumber = `SES-${today}-${String(sessionCounter++).padStart(3, '0')}`;

  const session = {
    id: crypto.randomUUID(),
    storeId,
    tableNumber,
    sessionNumber,
    status: 'ACTIVE',
    totalAmount: 0,
    guestCount: 1,
    startedAt: new Date().toISOString(),
    endedAt: null,
    guest: null,
    orders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  sessions.push(session);
  console.log('[MSW] Session created:', session);

  return session;
}

// 세션 찾기 헬퍼
export function findActiveSession(storeId: string, tableNumber: number) {
  return sessions.find(
    (s) => s.storeId === storeId && s.tableNumber === tableNumber && s.status === 'ACTIVE'
  );
}

// 세션 총액 업데이트 헬퍼
export function updateSessionTotal(sessionId: string, amount: number) {
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.totalAmount += amount;
  }
}

// 세션에 주문 추가 헬퍼
export function addOrderToSession(sessionId: string, order: any) {
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.orders.push(order);
  }
}
