/**
 * Mock 데이터 사용 여부 및 헬퍼 함수 관리
 */

// Mock 모드 확인 (환경 변수 또는 기타 설정에 따라 결정)
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

/**
 * Mock 데이터 반환 헬퍼 함수
 * @param data 반환할 Mock 데이터
 * @param delay 지연 시간 (ms)
 */
export function mockQuery<T>(data: T, delay = 500) {
    return new Promise<T>((resolve) => {
        setTimeout(() => resolve(data), delay);
    });
}
