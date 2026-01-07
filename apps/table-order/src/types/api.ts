/**
 * API 공통 타입 정의
 */

/**
 * 기본 API 응답 래퍼
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

/**
 * API 에러 응답
 */
export interface ApiError {
  success: false;
  message: string;
  code?: string;
  status?: number;
  timestamp?: string;
  path?: string;
}

/**
 * API 요청 상태
 */
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';
