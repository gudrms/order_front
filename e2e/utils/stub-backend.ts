import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';

/**
 * 테이블오더 layout.tsx 가 server component 에서 직접 fetch 하는
 * `/stores/identifier/:storeType/:branchId` 만 응답하는 stub.
 *
 * Playwright `page.route()` 는 브라우저 요청만 가로챌 수 있고
 * Next.js Node 런타임의 SSR fetch 는 잡지 못해서, 별도 stub HTTP
 * 서버가 필요하다.
 */

const STUB_STORE = {
  id: 'store-e2e-1',
  name: 'E2E 타코몰리',
  branchName: '김포점',
  storeType: 'tacomolly',
  branchId: 'gimpo',
  isActive: true,
  isDeliveryEnabled: true,
  menuManagementMode: 'ADMIN_DIRECT',
  deliveryEnabled: false,
  minOrderAmount: 0,
  minimumOrderAmount: 0,
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
  freeDeliveryAmount: 0,
};

const STUB_STORES = [
  {
    ...STUB_STORE,
    id: 'store-brand-e2e-1',
    name: '타코몰리',
    branchName: '부평점',
    address: '인천 부평구 장제로249번길 9 1층',
    phoneNumber: '032-555-7777',
    businessHours: { default: '11:00 - 22:00' },
    estimatedDeliveryMinutes: 30,
    lat: 37.507,
    lng: 126.722,
  },
  {
    ...STUB_STORE,
    id: 'store-brand-e2e-2',
    name: '타코몰리',
    branchName: '루원시티점',
    address: '인천 서구 서곶로 45',
    phoneNumber: '032-777-8888',
    businessHours: { default: '11:00 - 22:00' },
    estimatedDeliveryMinutes: 35,
    lat: 37.525,
    lng: 126.675,
  },
];

const STUB_CATEGORIES = [
  { id: 'cat-brand-1', name: '타코', sortOrder: 1, displayOrder: 1, isActive: true },
];

const STUB_MENUS = [
  {
    id: 'menu-brand-1',
    name: '시그니처 타코',
    price: 9000,
    description: '직화구이 고기와 신선한 살사의 조화',
    imageUrl: '',
    isAvailable: true,
    soldOut: false,
    isActive: true,
    categoryId: 'cat-brand-1',
    optionGroups: [],
  },
];

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
}

function handle(req: IncomingMessage, res: ServerResponse) {
  const url = req.url ?? '';

  if (req.method === 'OPTIONS') {
    json(res, {}, 204);
    return;
  }

  if (req.method === 'GET' && url.startsWith('/api/v1/stores/identifier/')) {
    json(res, { data: STUB_STORE });
    return;
  }

  if (req.method === 'GET' && /^\/api\/v1\/stores(\?.*)?$/.test(url)) {
    json(res, { data: STUB_STORES });
    return;
  }

  if (req.method === 'GET' && /^\/api\/v1\/stores\/[^/]+$/.test(url)) {
    json(res, { data: STUB_STORE });
    return;
  }

  if (
    req.method === 'GET' &&
    /^\/api\/v1\/stores\/[^/]+\/categories(\?.*)?$/.test(url)
  ) {
    json(res, { data: STUB_CATEGORIES });
    return;
  }

  if (
    req.method === 'GET' &&
    /^\/api\/v1\/stores\/[^/]+\/menus(\?.*)?$/.test(url)
  ) {
    json(res, { data: STUB_MENUS });
    return;
  }

  json(res, { error: 'NOT_FOUND', path: url }, 404);
}

export function startStubBackend(port = 4000): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer(handle);
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve(server);
    });
  });
}

export function stopStubBackend(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}
