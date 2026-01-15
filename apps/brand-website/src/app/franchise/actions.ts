'use server';

import { sendEmail } from '../../../../../packages/shared/src/utils/email';
import { cookies } from 'next/headers';

interface FranchiseInquiryState {
    success: boolean;
    message: string;
}

export async function submitFranchiseInquiry(prevState: any, formData: FormData): Promise<FranchiseInquiryState> {
    // Rate Limiting (Cookie-based)
    const cookieStore = await cookies();
    const lastSubmit = cookieStore.get('last-franchise-inquiry');

    if (lastSubmit) {
        const lastTime = parseInt(lastSubmit.value);
        const now = Date.now();
        const timeDiff = now - lastTime;
        const cooldown = 60 * 1000; // 60 seconds

        if (timeDiff < cooldown) {
            const remaining = Math.ceil((cooldown - timeDiff) / 1000);
            return { success: false, message: `너무 많은 요청이 발생했습니다. ${remaining}초 후에 다시 시도해주세요.` };
        }
    }

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const area = formData.get('area') as string;
    const area = formData.get('area') as string;
    const message = formData.get('message') as string;
    const honeypot = formData.get('website') as string;

    // Honeypot Check
    if (honeypot) {
        // Bot detected - return success to fool the bot, but don't send email
        return { success: true, message: '가맹 상담 신청이 완료되었습니다.' };
    }

    if (!name || !phone || !area || !email) {
        return { success: false, message: '필수 항목을 모두 입력해주세요.' };
    }

    // Validation
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(phone)) {
        return { success: false, message: '연락처는 11자리 숫자만 입력해주세요.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, message: '올바른 이메일 형식을 입력해주세요.' };
    }

    // Email Content
    const emailHtml = `
        <h2>[타코몰리] 새로운 가맹 문의가 도착했습니다.</h2>
        <p><strong>이름:</strong> ${name}</p>
        <p><strong>이름:</strong> ${name}</p>
        <p><strong>연락처:</strong> ${phone}</p>
        <p><strong>이메일:</strong> ${email}</p>
        <p><strong>희망 지역:</strong> ${area}</p>
        <p><strong>희망 지역:</strong> ${area}</p>
        <p><strong>문의 내용:</strong></p>
        <pre>${message}</pre>
    `;

    // Send Email (to admin)
    // In a real app, EMAIL_TO would be in env, or hardcoded for now
    const adminEmail = process.env.ADMIN_EMAIL || 'vndanwl@naver.com';

    const result = await sendEmail({
        to: adminEmail,
        subject: `[가맹문의] ${name}님 - ${area}`,
        html: emailHtml,
    });

    if (result.success) {
        // Set Rate Limit Cookie
        cookieStore.set('last-franchise-inquiry', Date.now().toString(), {
            maxAge: 60, // 1 minute
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        return { success: true, message: '가맹 상담 신청이 완료되었습니다. 담당자가 곧 연락드리겠습니다.' };
    } else {
        return { success: false, message: '메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    }
}
