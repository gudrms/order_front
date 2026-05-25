const DEFAULT_REVALIDATE_SECONDS = 60;
const DEFAULT_STALE_WHILE_REVALIDATE_SECONDS = 300;

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

export function publicCacheControl(revalidate = DEFAULT_REVALIDATE_SECONDS) {
    return `s-maxage=${revalidate}, stale-while-revalidate=${DEFAULT_STALE_WHILE_REVALIDATE_SECONDS}`;
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
            revalidate,
        };
    }

    return {
        ok: true as const,
        status: response.status,
        data: unwrapData(payload),
        revalidate,
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
