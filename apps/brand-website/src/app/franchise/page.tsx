import { Metadata } from 'next';
import FranchiseContent from './FranchiseContent';

export const metadata: Metadata = {
    title: '가맹안내 | 타코몰리',
    description: '타코몰리와 함께 성공적인 창업을 시작하세요. 가맹 개설 비용, 절차, 수익성 등 상세한 정보를 확인하실 수 있습니다.',
};

export default function FranchisePage() {
    return <FranchiseContent />;
}
