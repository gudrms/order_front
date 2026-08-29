import Link from 'next/link';
import { COMPANY, COMPANY_INFO_ROWS } from '@order/shared/constants/company';

/** 개인정보처리방침은 브랜드 사이트에서 관리한다. */
const PRIVACY_URL = 'https://www.tacomole.kr/privacy';

export default function SiteFooter() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 px-4 py-8 text-xs leading-relaxed text-gray-500">
            <div className="max-w-[568px] mx-auto space-y-3">
                <p className="text-sm font-bold text-gray-700">{COMPANY.name}</p>

                <dl className="space-y-1">
                    {COMPANY_INFO_ROWS.map(([label, value]) => (
                        <div key={label} className="flex gap-2">
                            <dt className="w-24 flex-shrink-0 text-gray-400">{label}</dt>
                            <dd className="flex-1 text-gray-600">{value}</dd>
                        </div>
                    ))}
                </dl>

                <nav className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                    <Link href="/terms" className="hover:text-gray-800">이용약관</Link>
                    <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="hover:text-gray-800">
                        개인정보처리방침
                    </a>
                    <Link href="/refund-policy" className="hover:text-gray-800">취소·환불 정책</Link>
                </nav>

                <p className="pt-2 text-gray-400">
                    {COMPANY.nameShort}는 타코몰리 브랜드 매장에서 직접 조리·판매하는 통신판매업자이며, 판매 상품에 대한
                    책임을 집니다.
                </p>
            </div>
        </footer>
    );
}
