import { Metadata } from 'next';
import StoreContent from './StoreContent';

export const metadata: Metadata = {
    title: '매장찾기 | 타코몰리',
    description: '가까운 타코몰리 매장을 찾아보세요. 위치, 영업시간, 연락처 정보를 확인하실 수 있습니다.',
};

export default function StorePage() {
    return <StoreContent />;
}
