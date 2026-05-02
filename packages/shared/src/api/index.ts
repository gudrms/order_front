/**
 * API 통합 export
 */

import * as menuApi from './endpoints/menu';
import * as orderApi from './endpoints/order';
import * as paymentApi from './endpoints/payment';
import * as tableApi from './endpoints/table';
import * as callApi from './endpoints/call';
import * as adminApi from './endpoints/admin';
import * as storeApi from './endpoints/store';
import * as authApi from './endpoints/auth';
import * as addressApi from './endpoints/address';
import * as couponApi from './endpoints/coupon';

export { apiClient, ApiClientError } from './client';
export { cancelOrder, createHomepageOrder, createOrder, getDeliveryOrders, getOrder, getOrdersByTable, updateDeliveryStatus, updateOrderStatus } from './endpoints/order';
export { cancelOrderTossPayment, confirmTossPayment, failTossPayment } from './endpoints/payment';
export { getCategories, getMenus, getMenuDetail } from './endpoints/menu';
export { getStore, getStoreByIdentifier, getAllStores } from './endpoints/store';
export { syncCurrentUser } from './endpoints/auth';
export { createAddress, deleteAddress, getAddresses, setDefaultAddress, updateAddress } from './endpoints/address';
export { getAvailableCoupons, getMyCoupons, redeemCoupon } from './endpoints/coupon';

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
    store: storeApi,
    auth: authApi,
    address: addressApi,
    coupon: couponApi,
};
