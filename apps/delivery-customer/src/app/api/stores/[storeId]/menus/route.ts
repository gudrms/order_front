import { NextResponse } from 'next/server';
import type { Menu } from '@order/shared';
import {
    fetchCachedPublicData,
    publicCacheControl,
    publicCacheTags,
} from '@/lib/cached-public-api';

type RouteContext = {
    params: Promise<{ storeId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
    const { storeId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';

    const result = await fetchCachedPublicData<Menu[]>(`/stores/${storeId}/menus${query}`, {
        tags: [publicCacheTags.menus(storeId)],
    });

    if (!result.ok) {
        return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json(result.data, {
        headers: { 'Cache-Control': publicCacheControl(result.revalidate) },
    });
}
