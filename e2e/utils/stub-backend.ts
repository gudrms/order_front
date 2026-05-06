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
  menuManagementMode: 'ADMIN_DIRECT',
  deliveryEnabled: false,
  minOrderAmount: 0,
  deliveryFee: 0,
  freeDeliveryAmount: 0,
};

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function handle(req: IncomingMessage, res: ServerResponse) {
  const url = req.url ?? '';

  if (req.method === 'GET' && url.startsWith('/api/v1/stores/identifier/')) {
    json(res, { data: STUB_STORE });
    return;
  }

  json(res, { error: 'NOT_FOUND', path: url }, 404);
}

export function startStubBackend(port = 4000): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer(handle);
    server.once('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject);
      resolve(server);
    });
  });
}

export function stopStubBackend(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}
