// Next 데이터 캐시 TTL. 백엔드 쓰기 시 POST /api/revalidate로 태그를 즉시 무효화하므로
// (on-demand revalidation) 길게 잡아도 신선도 손실이 없고, 캐시 miss 빈도
// (=백엔드 cold start 호출)를 낮춘다.
const DEFAULT_REVALIDATE_SECONDS = 300;

type ApiEnvelope<T> = {
    data?: T;
    message?: string;
    code?: string;
};

type CachedFetchOptions = {
    tags: string[];
    revalidate?: number;
};

export const publicCacheTags = {
    banners: 'delivery:banners',
    stores: 'delivery:stores',
    store: (storeId: string) => `delivery:store:${storeId}`,
    categories: (storeId: string) => `delivery:store:${storeId}:categories`,
    menus: (storeId: string) => `delivery:store:${storeId}:menus`,
    menuDetails: 'delivery:menus:details',
    menu: (menuId: string) => `delivery:menu:${menuId}`,
};

/**
 * CDN(Vercel 엣지) 응답 캐시는 `revalidateTag`가 닿지 않는다. s-maxage를 주면
 * 태그를 무효화해도 옛 응답이 s-maxage 동안 그대로 서빙된다.
 * (실측: 메뉴를 바꾸고 태그를 지워도 `X-Vercel-Cache: HIT`로 5분간 옛 메뉴가 나갔다)
 *
 * 품절 처리가 즉시 반영되지 않으면 고객이 주소까지 입력한 뒤 주문 단계에서 막히므로,
 * 엣지에는 캐시하지 않고 Next 데이터 캐시에만 의존한다. 데이터 캐시는 그대로라
 * 백엔드 cold start 방어는 유지된다.
 */
export function publicCacheControl() {
    return 'no-store';
}

export async function fetchCachedPublicData<T>(
    endpoint: string,
    { tags, revalidate = DEFAULT_REVALIDATE_SECONDS }: CachedFetchOptions,
) {
    const response = await fetch(`${getBackendApiUrl()}${endpoint}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate, tags },
    });

    const payload = await readPayload<T>(response);

    if (!response.ok) {
        return {
            ok: false as const,
            status: response.status,
            body: normalizeError(payload, response.status),
        };
    }

    return {
        ok: true as const,
        status: response.status,
        data: unwrapData(payload),
    };
}

function getBackendApiUrl() {
    return (
        process.env.BACKEND_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'https://api.tacomole.kr/api/v1'
    ).replace(/\/$/, '');
}

async function readPayload<T>(response: Response): Promise<ApiEnvelope<T> | T | string | null> {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }

    const text = await response.text();
    return text || null;
}

function unwrapData<T>(payload: ApiEnvelope<T> | T | string | null): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as ApiEnvelope<T>).data as T;
    }

    return payload as T;
}

function normalizeError<T>(payload: ApiEnvelope<T> | T | string | null, status: number) {
    if (payload && typeof payload === 'object') {
        return payload;
    }

    return {
        statusCode: status,
        message: typeof payload === 'string' && payload ? payload : 'Public API request failed',
    };
}
