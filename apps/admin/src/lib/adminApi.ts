import axios from 'axios';

/**
 * admin 전용 axios 인스턴스.
 *
 * NestJS TransformInterceptor가 모든 응답을 { statusCode, data: ACTUAL } 형태로
 * 감싸기 때문에, 응답 인터셉터에서 ACTUAL 을 꺼내 response.data 에 직접 대입한다.
 *
 * 이후 각 queryFn 은 다음처럼 단순화된다.
 *   - 단순 배열/객체:    return response.data
 *   - 페이지네이션:      return response.data?.data ?? response.data
 */
export const adminApi = axios.create();

adminApi.interceptors.response.use((response) => {
    const d = response.data;
    // shared/api/client.ts handleResponse 와 동일한 조건:
    // 'data' 키가 있으면 래퍼를 벗겨 ACTUAL 값만 반환
    if (d !== null && typeof d === 'object' && 'data' in d) {
        return { ...response, data: (d as Record<string, unknown>).data };
    }
    return response;
});
