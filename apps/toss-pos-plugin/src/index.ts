import { syncCatalogs, setupCatalogListeners } from './catalog';
import { pollOrders, setupOrderCancelListener } from './order';
import { setupRealtime } from './realtime';

console.log('Toss POS Plugin initialized');

// 1. 카탈로그 동기화
syncCatalogs();
setupCatalogListeners();

// 2. Realtime + Polling 시작
setupRealtime();

// 3. 초기 주문 체크
pollOrders();

// 4. 토스 POS 주문 취소 이벤트
setupOrderCancelListener();
