/**
 * 직원 호출 관련 API 엔드포인트
 */

import type { Call, CreateCallRequest } from '../../types';
import { apiClient } from '../client';

/**
 * 직원 호출 생성
 */
export async function createCall(data: CreateCallRequest): Promise<Call> {
    return apiClient.post<Call>(
        `/stores/${data.storeId}/tables/${data.tableNumber}/calls`,
        {
            type: data.type,
            message: data.message,
        }
    );
}
