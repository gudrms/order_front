import { Metadata } from 'next';
import MenuContent from './MenuContent';

export const metadata: Metadata = {
    title: '메뉴소개 | 타코몰리',
    description: '타코몰리의 신선하고 맛있는 멕시칸 메뉴들을 소개합니다. 타코, 부리또, 퀘사디아 등 다양한 메뉴를 만나보세요.',
};

export default function MenuPage() {
    return <MenuContent />;
}
