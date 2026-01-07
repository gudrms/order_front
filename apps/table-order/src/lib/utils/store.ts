/**
 * 매장 관련 유틸리티 함수
 */

/**
 * 기본 매장 타입 가져오기
 * @returns 매장 타입 (예: "tacomolly")
 */
export const getDefaultStoreType = (): string => {
  return process.env.NEXT_PUBLIC_DEFAULT_STORE_TYPE || 'tacomolly';
};

/**
 * 기본 지점 ID 가져오기
 * @returns 지점 ID (예: "gimpo")
 */
export const getDefaultBranchId = (): string => {
  return process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID || 'gimpo';
};

/**
 * 매장 URL 생성
 * @param path - 경로 (예: '/menu', '/cart')
 * @returns 전체 URL (예: '/tacomolly/gimpo/menu')
 * 
 * @example
 * getStoreUrl('/menu')  // '/tacomolly/gimpo/menu'
 * getStoreUrl('/cart')  // '/tacomolly/gimpo/cart'
 */
export const getStoreUrl = (path: string): string => {
  const storeType = getDefaultStoreType();
  const branchId = getDefaultBranchId();
  return `/${storeType}/${branchId}${path}`;
};

/**
 * 현재 URL에서 storeType과 branchId 추출
 * @param params - Next.js params 객체
 * @returns { storeType, branchId }
 */
export const getStoreParams = (params: { storeType?: string; branchId?: string }) => {
  return {
    storeType: params.storeType || getDefaultStoreType(),
    branchId: params.branchId || getDefaultBranchId(),
  };
};
