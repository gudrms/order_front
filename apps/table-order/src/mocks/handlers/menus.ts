/**
 * MSW Handlers - Menus API
 */

import { http, HttpResponse } from 'msw';
import { mockMenus } from '../data/menus';
import { mockCategories } from '../data/categories';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const menusHandlers = [
  // GET /api/v1/stores/:storeId/categories
  http.get(`${API_BASE}/stores/:storeId/categories`, () => {
    console.log('[MSW] Categories request');
    return HttpResponse.json({
      data: mockCategories,
    });
  }),

  // GET /api/v1/stores/:storeId/menus
  http.get(`${API_BASE}/stores/:storeId/menus`, ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');

    console.log('[MSW] Menus request, categoryId:', categoryId);

    const filteredMenus = categoryId
      ? mockMenus.filter((menu) => menu.categoryId === categoryId)
      : mockMenus;

    return HttpResponse.json({
      data: filteredMenus,
    });
  }),

  // GET /api/v1/menus/:menuId
  http.get(`${API_BASE}/menus/:menuId`, ({ params }) => {
    const { menuId } = params;
    console.log('[MSW] Menu detail request:', menuId);

    const menu = mockMenus.find((m) => m.id === menuId);

    if (!menu) {
      return HttpResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    // 메뉴 상세 정보 (옵션 포함)
    const menuDetail = {
      ...menu,
      options: [
        {
          id: 'opt-group-1',
          name: '맵기 선택',
          isRequired: true,
          items: [
            { id: 'opt-1', name: '순한맛', price: 0 },
            { id: 'opt-2', name: '중간맛', price: 0 },
            { id: 'opt-3', name: '매운맛', price: 0 },
          ],
        },
      ],
    };

    return HttpResponse.json({ data: menuDetail });
  }),
];
