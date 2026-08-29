import type { Metadata } from 'next';
import { PolicyPage } from '@order/ui';
import { TERMS_SECTIONS, TERMS_EFFECTIVE_DATE } from '@order/shared/constants/legal';

export const metadata: Metadata = {
    title: '이용약관',
    description: '타코몰리 배달 주문 서비스 이용약관',
};

export default function TermsPage() {
    return (
        <PolicyPage title="이용약관" effectiveDate={TERMS_EFFECTIVE_DATE} sections={TERMS_SECTIONS} />
    );
}
