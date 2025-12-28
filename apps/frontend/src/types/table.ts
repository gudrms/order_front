/**
 * 테이블 관련 타입 정의
 */

/**
 * 테이블 상태
 */
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

/**
 * 테이블 상태 한글 매핑
 */
export const TableStatusLabel: Record<TableStatus, string> = {
  AVAILABLE: '공석',
  OCCUPIED: '식사중',
  RESERVED: '예약됨',
  CLEANING: '정리중',
};

/**
 * 테이블
 */
export interface Table {
  id: string; // UUID
  number: number; // 테이블 번호는 number 유지
  capacity: number;
  status: TableStatus;
  currentOrderId: string | null; // UUID
  occupiedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 테이블 상태 변경 요청 DTO
 */
export interface UpdateTableStatusRequest {
  status: TableStatus;
}
