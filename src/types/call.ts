/**
 * 직원 호출 관련 타입 정의
 */

/**
 * 호출 타입
 */
export type CallType = 'WATER' | 'TISSUE' | 'CUTLERY' | 'OTHER';

/**
 * 호출 타입 한글 매핑
 */
export const CallTypeLabel: Record<CallType, string> = {
  WATER: '물',
  TISSUE: '티슈',
  CUTLERY: '수저',
  OTHER: '기타',
};

/**
 * 호출 상태
 */
export type CallStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

/**
 * 호출 상태 한글 매핑
 */
export const CallStatusLabel: Record<CallStatus, string> = {
  PENDING: '대기중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

/**
 * 직원 호출
 */
export interface Call {
  id: string; // UUID
  tableId: string; // UUID
  tableNumber?: number;
  type: CallType;
  message: string | null;
  status: CallStatus;
  createdAt: string;
  completedAt: string | null;
}

/**
 * 직원 호출 생성 요청 DTO
 */
export interface CreateCallRequest {
  tableId: string; // UUID
  type: CallType;
  message?: string | null;
}
