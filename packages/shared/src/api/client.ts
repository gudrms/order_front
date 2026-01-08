/**
 * API 클라이언트
 * Fetch API 기반 HTTP 클라이언트
 */

import type { ApiError, ApiResponse } from '../types';

/**
 * API 기본 URL
 */
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/**
 * 요청 타임아웃 (10초)
 */
const REQUEST_TIMEOUT = 10000;

/**
 * API 에러 클래스
 */
export class ApiClientError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
        public data?: unknown
    ) {
        super(message);
        this.name = 'ApiClientError';
    }
}

/**
 * 요청 옵션 타입
 */
interface RequestOptions extends RequestInit {
    timeout?: number;
}

/**
 * 타임아웃을 지원하는 fetch 래퍼
 */
async function fetchWithTimeout(
    url: string,
    options: RequestOptions = {}
): Promise<Response> {
    const { timeout = REQUEST_TIMEOUT, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
            throw new ApiClientError(408, 'TIMEOUT', '요청 시간이 초과되었습니다.');
        }
        throw err;
    }
}

/**
 * API 응답 처리
 */
async function handleResponse<T>(response: Response): Promise<T> {
    // Content-Type 확인
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    // 응답 본문 파싱
    let data: unknown;
    try {
        data = isJson ? await response.json() : await response.text();
    } catch {
        throw new ApiClientError(
            response.status,
            'PARSE_ERROR',
            '응답 파싱에 실패했습니다.'
        );
    }

    // 에러 응답 처리
    if (!response.ok) {
        const errorData = data as ApiError;
        throw new ApiClientError(
            response.status,
            errorData.code || 'UNKNOWN_ERROR',
            errorData.message || '알 수 없는 오류가 발생했습니다.',
            errorData
        );
    }

    // 성공 응답에서 data 추출
    if (data && typeof data === 'object' && 'data' in data) {
        return (data as ApiResponse<T>).data!; // Non-null assertion
    }

    return data as T;
}

/**
 * API 클라이언트
 */
export const apiClient = {
    /**
     * GET 요청
     */
    async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        if (process.env.NODE_ENV === 'development') {
            console.log('[API GET]', url);
        }

        const response = await fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        return handleResponse<T>(response);
    },

    /**
     * POST 요청
     */
    async post<T>(
        endpoint: string,
        data?: unknown,
        options?: RequestOptions
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        if (process.env.NODE_ENV === 'development') {
            console.log('[API POST]', url, data);
        }

        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        });

        return handleResponse<T>(response);
    },

    /**
     * PATCH 요청
     */
    async patch<T>(
        endpoint: string,
        data?: unknown,
        options?: RequestOptions
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        if (process.env.NODE_ENV === 'development') {
            console.log('[API PATCH]', url, data);
        }

        const response = await fetchWithTimeout(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        });

        return handleResponse<T>(response);
    },

    /**
     * PUT 요청
     */
    async put<T>(
        endpoint: string,
        data?: unknown,
        options?: RequestOptions
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        if (process.env.NODE_ENV === 'development') {
            console.log('[API PUT]', url, data);
        }

        const response = await fetchWithTimeout(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        });

        return handleResponse<T>(response);
    },

    /**
     * DELETE 요청
     */
    async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        if (process.env.NODE_ENV === 'development') {
            console.log('[API DELETE]', url);
        }

        const response = await fetchWithTimeout(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        return handleResponse<T>(response);
    },
};
