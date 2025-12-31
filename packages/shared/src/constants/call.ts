/**
 * 직원 호출 관련 상수
 */

import type { CallType, CallStatus } from '../types';

/**
 * 호출 타입 한글 레이블
 */
export const CALL_TYPE_LABEL: Record<CallType, string> = {
  WATER: '물',
  TISSUE: '티슈',
  CUTLERY: '수저',
  OTHER: '기타',
};

/**
 * 호출 상태 한글 레이블
 */
export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  PENDING: '대기 중',
  PROCESSING: '처리 중',
  COMPLETED: '완료',
};

/**
 * 호출 상태 색상 (Tailwind CSS 클래스)
 */
export const CALL_STATUS_COLOR: Record<CallStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
};
