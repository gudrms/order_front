import { NextResponse } from 'next/server';
import {
    fetchCachedPublicData,
    publicCacheControl,
    publicCacheTags,
} from '@/lib/cached-public-api';
import type { BrandBanner } from '@/hooks/queries/useBrandBanners';

export async function GET() {
    const result = await fetchCachedPublicData<BrandBanner[]>('/brand-banners', {
        tags: [publicCacheTags.banners],
    });

    if (!result.ok) {
        return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json(result.data, {
        headers: { 'Cache-Control': publicCacheControl(result.revalidate) },
    });
}
