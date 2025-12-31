/**
 * 직원 호출 관련 공통 타입 정의
 * Frontend ↔ Backend 공유
 */

/**
 * 호출 타입
 */
export type CallType = 'WATER' | 'TISSUE' | 'CUTLERY' | 'OTHER';

/**
 * 호출 상태 (Prisma enum과 일치)
 */
export type CallStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED';

/**
 * 직원 호출
 */
export interface StaffCall {
  id: string; // UUID
  tableId: string; // UUID
  tableNumber?: number; // JOIN 결과
  storeId: string; // UUID
  type: CallType;
  message: string | null;
  status: CallStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt: Date | string | null;
}

/**
 * @deprecated Use StaffCall instead
 * 하위 호환성을 위한 alias
 */
export type Call = StaffCall;

/**
 * 직원 호출 생성 요청 DTO
 */
export interface CreateCallRequest {
  tableId: string; // UUID
  storeId?: string; // UUID (선택적, 서버에서 추론 가능)
  type: CallType;
  message?: string | null;
}

/**
 * 호출 상태 변경 요청 DTO
 */
export interface UpdateCallStatusRequest {
  status: CallStatus;
}
