/**
 * 테이블 관련 API 엔드포인트
 */

import type { Table } from '@/types';
import { apiClient } from '../client';

/**
 * 테이블 목록 조회
 */
export async function getTables(storeId: number): Promise<Table[]> {
  return apiClient.get<Table[]>(`/stores/${storeId}/tables`);
}

/**
 * 테이블 상세 조회
 */
export async function getTableDetail(tableId: number): Promise<Table> {
  return apiClient.get<Table>(`/tables/${tableId}`);
}
