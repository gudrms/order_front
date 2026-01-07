/**
 * QR 코드 생성 유틸리티
 *
 * 테이블별 QR 코드 URL 생성
 */

/**
 * 테이블 QR 코드 URL 생성
 *
 * @param storeType - 매장 타입 (예: 'tacomolly')
 * @param branchId - 지점 ID (예: 'gimpo')
 * @param tableNumber - 테이블 번호 (예: 5)
 * @param baseUrl - 기본 도메인 (선택, 기본값: 현재 origin)
 * @returns QR 코드에 담을 전체 URL
 *
 * @example
 * generateTableQRUrl('tacomolly', 'gimpo', 5)
 * // → 'https://yourdomain.com/tacomolly/gimpo/table/5'
 *
 * generateTableQRUrl('tacomolly', 'gimpo', 5, 'https://custom-domain.com')
 * // → 'https://custom-domain.com/tacomolly/gimpo/table/5'
 */
export const generateTableQRUrl = (
  storeType: string,
  branchId: string,
  tableNumber: number,
  baseUrl?: string
): string => {
  const domain = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${domain}/${storeType}/${branchId}/table/${tableNumber}`;
};

/**
 * 테이블 범위에 대한 QR 코드 URL 배열 생성
 *
 * @param storeType - 매장 타입
 * @param branchId - 지점 ID
 * @param startTable - 시작 테이블 번호
 * @param endTable - 끝 테이블 번호
 * @param baseUrl - 기본 도메인 (선택)
 * @returns QR URL 배열
 *
 * @example
 * generateTableQRUrls('tacomolly', 'gimpo', 1, 10)
 * // → ['https://yourdomain.com/tacomolly/gimpo/table/1', ..., 'https://yourdomain.com/tacomolly/gimpo/table/10']
 */
export const generateTableQRUrls = (
  storeType: string,
  branchId: string,
  startTable: number,
  endTable: number,
  baseUrl?: string
): Array<{ tableNumber: number; url: string }> => {
  const urls: Array<{ tableNumber: number; url: string }> = [];

  for (let i = startTable; i <= endTable; i++) {
    urls.push({
      tableNumber: i,
      url: generateTableQRUrl(storeType, branchId, i, baseUrl),
    });
  }

  return urls;
};
