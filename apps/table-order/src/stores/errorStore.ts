/**
 * 전역 에러 상태 관리 Store
 */

import { create } from 'zustand';
import type { AppError, ErrorSeverity } from '@order/shared';

interface ErrorState {
  /** 발생한 모든 에러 목록 */
  errors: AppError[];

  /** 현재 표시 중인 에러 (Toast/Modal용) */
  currentError: AppError | null;

  /** 에러 추가 */
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;

  /** 특정 에러 제거 */
  clearError: (id: string) => void;

  /** 모든 에러 제거 */
  clearAllErrors: () => void;

  /** 현재 에러 설정 */
  setCurrentError: (error: AppError | null) => void;
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  errors: [],
  currentError: null,

  addError: (error) => {
    const newError: AppError = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    set((state) => ({
      errors: [...state.errors, newError],
      currentError: newError,
    }));

    // 개발 환경에서 콘솔 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('[AppError]', {
        severity: newError.severity,
        code: newError.code,
        message: newError.message,
        meta: newError.meta,
      });
    }

    // Critical 에러만 Backend로 전송 (프로덕션)
    if (error.severity === 'critical' && process.env.NODE_ENV === 'production') {
      sendErrorToBackend(newError);
    }

    // 심각도에 따라 자동 제거 시간 설정
    const autoRemoveTimeout = getAutoRemoveTimeout(newError.severity);
    if (autoRemoveTimeout > 0) {
      setTimeout(() => {
        const currentErrors = get().errors;
        if (currentErrors.find((e) => e.id === newError.id)) {
          get().clearError(newError.id);
        }
      }, autoRemoveTimeout);
    }
  },

  clearError: (id) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
      currentError: state.currentError?.id === id ? null : state.currentError,
    })),

  clearAllErrors: () => set({ errors: [], currentError: null }),

  setCurrentError: (error) => set({ currentError: error }),
}));

/**
 * 심각도에 따른 자동 제거 시간 반환 (ms)
 */
function getAutoRemoveTimeout(severity: ErrorSeverity): number {
  switch (severity) {
    case 'info':
      return 3000; // 3초
    case 'warning':
      return 5000; // 5초
    case 'error':
      return 7000; // 7초
    case 'critical':
      return 0; // 수동으로만 제거 (자동 제거 안 함)
    default:
      return 5000;
  }
}

/**
 * Critical 에러를 Backend API로 전송
 */
async function sendErrorToBackend(error: AppError): Promise<void> {
  try {
    await fetch('/api/v1/error-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errorCode: error.code || 'UNKNOWN',
        message: error.message,
        severity: error.severity,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        metadata: error.meta,
      }),
    });
  } catch (err) {
    // 에러 로깅 실패는 무시 (사용자 경험에 영향 주면 안 됨)
    console.error('[ErrorStore] Failed to send error to backend:', err);
  }
}
