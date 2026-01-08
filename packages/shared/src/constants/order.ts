/**
 * 주문 관련 상수
 */

import type { OrderStatus } from '../types';

/**
 * 주문 상태 한글 레이블
 */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: '접수 대기',
  CONFIRMED: '접수 완료',
  COOKING: '조리 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  PAID: '결제 완료',
  PREPARING: '준비 중',
  READY: '준비 완료',
  DELIVERING: '배달 중',
};

/**
 * 주문 상태 색상 (Tailwind CSS 클래스)
 */
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COOKING: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  PAID: 'bg-indigo-100 text-indigo-800',
  PREPARING: 'bg-amber-100 text-amber-800',
  READY: 'bg-teal-100 text-teal-800',
  DELIVERING: 'bg-purple-100 text-purple-800',
};
