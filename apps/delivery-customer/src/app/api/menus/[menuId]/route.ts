import { NextResponse } from 'next/server';
import type { MenuDetail } from '@order/shared';
import {
    fetchCachedPublicData,
    publicCacheControl,
    publicCacheTags,
} from '@/lib/cached-public-api';

type RouteContext = {
    params: Promise<{ menuId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
    const { menuId } = await params;
    const result = await fetchCachedPublicData<MenuDetail>(`/menus/${menuId}`, {
        tags: [publicCacheTags.menuDetails, publicCacheTags.menu(menuId)],
    });

    if (!result.ok) {
        return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json(result.data, {
        headers: { 'Cache-Control': publicCacheControl(result.revalidate) },
    });
}
