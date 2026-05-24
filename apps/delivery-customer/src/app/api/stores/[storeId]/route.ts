import { NextResponse } from 'next/server';
import type { Store } from '@order/shared';
import {
    fetchCachedPublicData,
    publicCacheControl,
    publicCacheTags,
} from '@/lib/cached-public-api';

type RouteContext = {
    params: Promise<{ storeId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
    const { storeId } = await params;
    const result = await fetchCachedPublicData<Store>(`/stores/${storeId}`, {
        tags: [publicCacheTags.stores, publicCacheTags.store(storeId)],
    });

    if (!result.ok) {
        return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json(result.data, {
        headers: { 'Cache-Control': publicCacheControl(result.revalidate) },
    });
}
