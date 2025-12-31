/**
 * 에러 관련 공통 타입 정의
 * Frontend ↔ Backend 공유
 */

/**
 * 에러 심각도
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * 애플리케이션 에러
 */
export interface AppError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  code?: string;
  timestamp: Date | string;
  meta?: Record<string, any>;
}

/**
 * 에러 로그 엔트리 (백엔드 저장용)
 */
export interface ErrorLogEntry {
  id: string;
  errorCode: string;
  message: string;
  severity: ErrorSeverity;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  storeId?: string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
}

/**
 * 에러 로그 생성 요청
 */
export interface CreateErrorLogRequest {
  errorCode: string;
  message: string;
  severity: ErrorSeverity;
  stackTrace?: string;
  url?: string;
  metadata?: Record<string, any>;
}
