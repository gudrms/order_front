/**
 * 테이블 관련 공통 타입 정의
 * Frontend ↔ Backend 공유
 */

/**
 * 테이블 상태 (Prisma enum과 일치)
 */
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

/**
 * 테이블
 */
export interface Table {
  id: string; // UUID
  number: number; // 테이블 번호
  capacity: number;
  status: TableStatus;
  storeId: string; // UUID
  currentOrderId: string | null; // UUID
  qrCodeUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 테이블 상태 변경 요청 DTO
 */
export interface UpdateTableStatusRequest {
  status: TableStatus;
}

/**
 * 테이블 생성 요청 DTO
 */
export interface CreateTableRequest {
  number: number;
  capacity: number;
  storeId: string; // UUID
}
