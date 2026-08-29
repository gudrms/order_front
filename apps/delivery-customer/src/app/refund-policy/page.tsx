import type { Metadata } from 'next';
import { PolicyPage } from '@order/ui';
import { REFUND_POLICY_SECTIONS, REFUND_POLICY_EFFECTIVE_DATE } from '@order/shared/constants/legal';

export const metadata: Metadata = {
    title: '취소·환불 정책',
    description: '타코몰리 배달 주문 취소 및 환불 정책',
};

export default function RefundPolicyPage() {
    return (
        <PolicyPage
            title="취소·환불 정책"
            effectiveDate={REFUND_POLICY_EFFECTIVE_DATE}
            sections={REFUND_POLICY_SECTIONS}
        />
    );
}
