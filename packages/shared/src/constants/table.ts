/**
 * 테이블 관련 상수
 */

import type { TableStatus } from '../types';

/**
 * 테이블 상태 한글 레이블
 */
export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  AVAILABLE: '공석',
  OCCUPIED: '사용 중',
  RESERVED: '예약됨',
};

/**
 * 테이블 상태 색상 (Tailwind CSS 클래스)
 */
export const TABLE_STATUS_COLOR: Record<TableStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  OCCUPIED: 'bg-red-100 text-red-800',
  RESERVED: 'bg-yellow-100 text-yellow-800',
};
