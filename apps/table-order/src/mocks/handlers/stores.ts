/**
 * MSW Handlers - Stores API
 */

import { http, HttpResponse } from 'msw';
import { mockStore } from '../data/store';
import { DOMAINS } from '@/lib/constants/domains';

const API_BASE = DOMAINS.API;

export const storesHandlers = [
  // GET /api/v1/stores/identifier/:storeType/:branchId
  http.get(`${API_BASE}/stores/identifier/:storeType/:branchId`, ({ params }) => {
    console.log('[MSW] Store identifier request:', params);
    const { storeType, branchId } = params;

    return HttpResponse.json({
      data: {
        ...mockStore,
        storeType: storeType as string,
        branchId: branchId as string,
        name: `타코몰리 ${branchId}점`,
      }
    });
  }),

  // GET /api/v1/stores/:storeId
  http.get(`${API_BASE}/stores/:storeId`, ({ params }) => {
    console.log('[MSW] Store by ID request:', params);

    return HttpResponse.json({ data: mockStore });
  }),
];
