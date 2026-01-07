'use client';

import { useTableStore } from '@/stores';
import { useEffect, useState } from 'react';

/**
 * 테이블 번호 확인 컴포넌트
 *
 * QR 코드로 진입한 사용자에게 테이블 번호를 표시하고 확인받습니다.
 * 3초 후 자동으로 사라지거나, 사용자가 직접 닫을 수 있습니다.
 */
export function TableConfirmation() {
  const { tableNumber } = useTableStore();
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (tableNumber !== null && tableNumber > 0) {
      setIsVisible(true);
      setCountdown(3);

      // 3초 카운트다운
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setIsVisible(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [tableNumber]);

  if (!isVisible || tableNumber === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 animate-scale-in">
        <div className="text-center">
          <div className="text-6xl mb-4">🪑</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            테이블 번호 확인
          </h2>
          <div className="text-5xl font-bold text-blue-600 my-6">
            {tableNumber}번
          </div>
          <p className="text-gray-600 mb-6">
            이 테이블에서 주문하시는게 맞나요?
          </p>
          <button
            onClick={() => setIsVisible(false)}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            확인 ({countdown}초)
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
