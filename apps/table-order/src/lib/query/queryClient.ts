/**
 * TanStack Query 클라이언트 설정
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient 인스턴스 생성
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 데이터가 fresh 상태로 유지되는 시간 (5분)
      staleTime: 5 * 60 * 1000,

      // 캐시가 유지되는 시간 (10분)
      gcTime: 10 * 60 * 1000,

      // 에러 발생 시 재시도 횟수
      retry: 1,

      // 윈도우 포커스 시 자동 refetch 비활성화
      refetchOnWindowFocus: false,

      // 마운트 시 자동 refetch 비활성화
      refetchOnMount: false,

      // 재연결 시 자동 refetch 활성화
      refetchOnReconnect: true,
    },
    mutations: {
      // mutation 에러 발생 시 재시도하지 않음
      retry: false,
    },
  },
});
