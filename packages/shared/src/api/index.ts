/**
 * API 통합 export
 */

import * as menuApi from './endpoints/menu';
import * as orderApi from './endpoints/order';
import * as paymentApi from './endpoints/payment';
import * as tableApi from './endpoints/table';
import * as callApi from './endpoints/call';
import * as adminApi from './endpoints/admin';

export { apiClient, ApiClientError } from './client';
export { createOrder, getOrdersByTable, updateOrderStatus } from './endpoints/order';
export { confirmTossPayment, failTossPayment } from './endpoints/payment';
export { getCategories, getMenus, getMenuDetail } from './endpoints/menu';

/**
 * 통합 API 객체
 */
export const api = {
    menu: menuApi,
    order: orderApi,
    payment: paymentApi,
    table: tableApi,
    call: callApi,
    admin: adminApi,
};
