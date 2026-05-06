'use server';

import { cookies } from 'next/headers';

interface FranchiseInquiryState {
    success: boolean;
    message: string;
}

export async function submitFranchiseInquiry(prevState: any, formData: FormData): Promise<FranchiseInquiryState> {
    // Rate Limiting (Cookie-based, 60초 쿨다운)
    const cookieStore = await cookies();
    const lastSubmit = cookieStore.get('last-franchise-inquiry');

    if (lastSubmit) {
        const lastTime = parseInt(lastSubmit.value);
        const timeDiff = Date.now() - lastTime;
        const cooldown = 60_000;

        if (timeDiff < cooldown) {
            const remaining = Math.ceil((cooldown - timeDiff) / 1000);
            return {
                success: false,
                message: `너무 많은 요청이 발생했습니다. ${remaining}초 후에 다시 시도해주세요.`,
            };
        }
    }

    const honeypot = formData.get('website') as string;

    if (honeypot) {
        return { success: true, message: '가맹 상담 신청이 완료되었습니다.' };
    }

    const name = (formData.get('name') as string)?.trim();
    const phone = (formData.get('phone') as string)?.replace(/[^0-9]/g, '');
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const area = (formData.get('area') as string)?.trim();
    const message = (formData.get('message') as string)?.trim();

    if (!name || !phone || !email || !area) {
        return { success: false, message: '필수 항목을 모두 입력해주세요.' };
    }

    if (!/^[0-9]{10,11}$/.test(phone)) {
        return { success: false, message: '연락처는 10~11자리 숫자만 입력해주세요.' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, message: '올바른 이메일 형식을 입력해주세요.' };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    try {
        const res = await fetch(`${apiUrl}/franchise-inquiries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, email, area, message: message || undefined }),
            signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return {
                success: false,
                message: body?.message ?? '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            };
        }
    } catch {
        return {
            success: false,
            message: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        };
    }

    cookieStore.set('last-franchise-inquiry', Date.now().toString(), {
        maxAge: 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });

    return {
        success: true,
        message: '가맹 상담 신청이 완료되었습니다. 담당자가 곧 연락드리겠습니다.',
    };
}
