import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // _auth cookie is set by AuthContext when Supabase session is active
    const isAuthenticated = request.cookies.has('_auth');

    if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname + search);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/orders/:path*',
        '/order/success',
        '/order/fail',
        '/mypage/:path*',
    ],
};
