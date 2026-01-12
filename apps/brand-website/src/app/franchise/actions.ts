'use server';

import { sendEmail } from '../../../../../packages/shared/src/utils/email';

interface FranchiseInquiryState {
    success: boolean;
    message: string;
}

export async function submitFranchiseInquiry(prevState: any, formData: FormData): Promise<FranchiseInquiryState> {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const area = formData.get('area') as string;
    const message = formData.get('message') as string;

    if (!name || !phone || !area) {
        return { success: false, message: '필수 항목을 모두 입력해주세요.' };
    }

    // Email Content
    const emailHtml = `
        <h2>[타코몰리] 새로운 가맹 문의가 도착했습니다.</h2>
        <p><strong>이름:</strong> ${name}</p>
        <p><strong>연락처:</strong> ${phone}</p>
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
        return { success: true, message: '가맹 상담 신청이 완료되었습니다. 담당자가 곧 연락드리겠습니다.' };
    } else {
        return { success: false, message: '메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.' };
    }
}
