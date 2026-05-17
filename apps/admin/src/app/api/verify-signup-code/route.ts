import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { code } = await req.json() as { code: string };
    const validCode = process.env.ADMIN_SIGNUP_CODE;

    if (!validCode || !code || code.trim() !== validCode.trim()) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
}
