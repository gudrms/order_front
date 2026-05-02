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
export type CallStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED';

/**
 * 호출 상태 한글 매핑
 */
export const CallStatusLabel: Record<CallStatus, string> = {
  PENDING: '대기중',
  PROCESSING: '처리중',
  COMPLETED: '완료',
};

/**
 * 직원 호출
 */
export interface Call {
  id: string; // UUID
  tableId?: string | null;
  tableNumber: number;
  storeId: string;
  type?: CallType;
  callType?: CallType | string | null;
  message?: string | null;
  status: CallStatus;
  createdAt: string;
  completedAt: string | null;
}

/**
 * 직원 호출 생성 요청 DTO
 */
export interface CreateCallRequest {
  tableId?: string; // legacy UUID 기반 호출
  storeId: string;
  tableNumber: number;
  type: CallType;
  message?: string | null;
}
