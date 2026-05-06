'use server';

import { cookies } from 'next/headers';
import { sendEmail } from '../../../../../packages/shared/src/utils/email';

interface FranchiseInquiryState {
  success: boolean;
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function submitFranchiseInquiry(
  _prevState: FranchiseInquiryState,
  formData: FormData
): Promise<FranchiseInquiryState> {
  const cookieStore = await cookies();
  const lastSubmit = cookieStore.get('last-franchise-inquiry');

  if (lastSubmit) {
    const lastTime = Number(lastSubmit.value);
    const now = Date.now();
    const cooldown = 60 * 1000;

    if (Number.isFinite(lastTime) && now - lastTime < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastTime)) / 1000);
      return { success: false, message: `요청이 너무 잦습니다. ${remaining}초 후 다시 시도해주세요.` };
    }
  }

  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const area = String(formData.get('area') || '').trim();
  const message = String(formData.get('message') || '').trim();
  const honeypot = String(formData.get('website') || '').trim();

  if (honeypot) {
    return { success: true, message: '가맹 상담 신청이 완료되었습니다.' };
  }

  if (!name || !phone || !area || !email) {
    return { success: false, message: '필수 항목을 모두 입력해주세요.' };
  }

  if (!/^[0-9]{11}$/.test(phone)) {
    return { success: false, message: '연락처는 11자리 숫자만 입력해주세요.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: '올바른 이메일 형식을 입력해주세요.' };
  }

  const saveResponse = await fetch(`${API_URL}/franchise-inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, area, message }),
    cache: 'no-store',
  });

  if (!saveResponse.ok) {
    return { success: false, message: '상담 신청 저장에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }

  const emailHtml = `
    <h2>[타코몰리] 새로운 가맹 문의가 도착했습니다.</h2>
    <p><strong>이름:</strong> ${escapeHtml(name)}</p>
    <p><strong>연락처:</strong> ${escapeHtml(phone)}</p>
    <p><strong>이메일:</strong> ${escapeHtml(email)}</p>
    <p><strong>희망 지역:</strong> ${escapeHtml(area)}</p>
    <p><strong>문의 내용:</strong></p>
    <pre>${escapeHtml(message)}</pre>
  `;

  const adminEmail = process.env.ADMIN_EMAIL || 'vndanwl@naver.com';
  const emailResult = await sendEmail({
    to: adminEmail,
    subject: `[가맹문의] ${name}님 - ${area}`,
    html: emailHtml,
  });

  if (!emailResult.success) {
    console.warn('Franchise inquiry email failed after successful save');
  }

  cookieStore.set('last-franchise-inquiry', Date.now().toString(), {
    maxAge: 60,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  return {
    success: true,
    message: '가맹 상담 신청이 완료되었습니다. 담당자가 곧 연락드리겠습니다.',
  };
}
