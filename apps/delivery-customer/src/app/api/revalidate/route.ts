import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { publicCacheTags } from '@/lib/cached-public-api';

type RevalidateRequest = {
    tags?: string[];
    storeId?: string;
    menuId?: string;
};

export async function POST(request: Request) {
    const secret = request.headers.get('x-revalidate-secret');
    if (!process.env.DELIVERY_REVALIDATE_SECRET || secret !== process.env.DELIVERY_REVALIDATE_SECRET) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as RevalidateRequest;
    const tags = new Set(body.tags || []);

    if (body.storeId) {
        tags.add(publicCacheTags.stores);
        tags.add(publicCacheTags.store(body.storeId));
        tags.add(publicCacheTags.categories(body.storeId));
        tags.add(publicCacheTags.menus(body.storeId));
        tags.add(publicCacheTags.menuDetails);
    }

    if (body.menuId) {
        tags.add(publicCacheTags.menu(body.menuId));
    }

    if (tags.size === 0) {
        return NextResponse.json({ message: 'No tags provided' }, { status: 400 });
    }

    for (const tag of tags) {
        revalidateTag(tag, { expire: 0 });
    }

    return NextResponse.json({ revalidated: Array.from(tags) });
}
