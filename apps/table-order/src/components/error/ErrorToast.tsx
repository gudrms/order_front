'use client';

import { useErrorStore } from '@/stores/errorStore';
import { useEffect } from 'react';

export function ErrorToast() {
  const { currentError, clearError } = useErrorStore();

  useEffect(() => {
    if (currentError && currentError.severity !== 'critical') {
      const timer = setTimeout(() => {
        clearError(currentError.id);
      }, getToastDuration(currentError.severity));

      return () => clearTimeout(timer);
    }
  }, [currentError, clearError]);

  if (!currentError) return null;

  const severityStyles = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    critical: 'bg-red-700',
  };

  const severityIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div
        className={`${severityStyles[currentError.severity]} flex min-w-[320px] items-start gap-3 rounded-lg p-4 text-white shadow-lg`}
      >
        <span className="text-2xl">{severityIcons[currentError.severity]}</span>
        <div className="flex-1">
          <p className="font-medium">{currentError.message}</p>
          {currentError.code && (
            <p className="mt-1 text-xs opacity-80">코드: {currentError.code}</p>
          )}
        </div>
        <button
          onClick={() => clearError(currentError.id)}
          className="text-white/80 transition-colors hover:text-white"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function getToastDuration(severity: string): number {
  switch (severity) {
    case 'info':
      return 3000;
    case 'warning':
      return 5000;
    case 'error':
      return 7000;
    default:
      return 5000;
  }
}
