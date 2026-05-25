import { NextResponse } from 'next/server';
import type { Store } from '@order/shared';
import {
    fetchCachedPublicData,
    publicCacheControl,
    publicCacheTags,
} from '@/lib/cached-public-api';

export async function GET() {
    const result = await fetchCachedPublicData<Store[]>('/stores', {
        tags: [publicCacheTags.stores],
    });

    if (!result.ok) {
        return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json(result.data, {
        headers: { 'Cache-Control': publicCacheControl(result.revalidate) },
    });
}
