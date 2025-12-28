/**
 * 직원 호출 Mutation 훅
 */

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Call, CreateCallRequest } from '@/types';

/**
 * 직원 호출 생성 훅
 */
export function useCreateCall() {
  return useMutation<Call, Error, CreateCallRequest>({
    mutationFn: (data) => api.call.createCall(data),
  });
}
