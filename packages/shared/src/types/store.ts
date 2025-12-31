/**
 * 매장 관련 공통 타입 정의
 * Frontend ↔ Backend 공유
 */

/**
 * 매장 타입 (Prisma enum과 일치)
 */
export type StoreType = 'MEXICAN' | 'PUB' | 'JAPANESE' | 'KOREAN' | 'CHINESE' | 'WESTERN' | 'CAFE' | 'GENERAL';

/**
 * 매장 정보
 */
export interface Store {
  id: string; // UUID
  storeType: string; // URL 경로용 (예: "tacomolly")
  branchId: string; // URL 경로용 (예: "gimpo")
  name: string; // 전체 이름 (예: "타코몰리 김포점")
  branchName: string; // 지점명 (예: "김포점")
  type: StoreType; // 업종 enum
  okposBranchCode: string | null; // OKPOS 지점 코드
  description: string | null;
  address: string | null;
  phoneNumber: string | null;
  businessHours: Record<string, any> | null; // JSON
  theme: Record<string, any> | null; // JSON
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 매장 생성 요청 DTO
 */
export interface CreateStoreRequest {
  storeType: string;
  branchId: string;
  name: string;
  branchName: string;
  type: StoreType;
  description?: string;
  address?: string;
  phoneNumber?: string;
}
