'use client';

import { useErrorStore } from '@/stores/errorStore';
import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  const { addError } = useErrorStore();

  const testErrorStore = () => {
    addError({
      code: 'TEST_ERROR_STORE',
      message: 'ErrorStore를 통한 Sentry 테스트',
      severity: 'error',
      meta: {
        testType: 'ErrorStore',
        timestamp: new Date().toISOString(),
      },
    });
  };

  const testSentryDirect = () => {
    try {
      throw new Error('직접 Sentry로 전송하는 테스트 에러');
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          testType: 'Direct',
        },
      });
    }
  };

  const testUndefinedFunction = () => {
    // @ts-ignore
    myUndefinedFunction();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Sentry 테스트 페이지</h1>

      <div className="flex flex-col gap-4">
        <button
          onClick={testErrorStore}
          className="rounded bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
        >
          테스트 1: ErrorStore로 에러 전송
        </button>

        <button
          onClick={testSentryDirect}
          className="rounded bg-green-500 px-6 py-3 text-white hover:bg-green-600"
        >
          테스트 2: Sentry 직접 전송
        </button>

        <button
          onClick={testUndefinedFunction}
          className="rounded bg-red-500 px-6 py-3 text-white hover:bg-red-600"
        >
          테스트 3: 실제 에러 발생 (undefined 함수 호출)
        </button>
      </div>

      <p className="mt-8 text-sm text-gray-600">
        버튼을 클릭한 후 Sentry 대시보드에서 확인하세요:<br />
        <a
          href="https://jhg-qn.sentry.io/issues/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          https://jhg-qn.sentry.io/issues/
        </a>
      </p>
    </div>
  );
}
