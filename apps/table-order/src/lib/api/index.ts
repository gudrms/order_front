/**
 * API 통합 export
 * table-order 전용 order 로직(첫 주문/추가 주문 세션 분기)만 로컬 유지.
 * 나머지(menu, table, call, admin 등)는 @order/shared의 api 객체 그대로 사용.
 */

import * as orderApi from './endpoints/order';
import { api as sharedApi } from '@order/shared';

export { apiClient, ApiClientError } from '@order/shared';

export const api = {
  ...sharedApi,
  order: orderApi,
};
