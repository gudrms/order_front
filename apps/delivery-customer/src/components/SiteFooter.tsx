import Link from 'next/link';
import { COMPANY, COMPANY_INFO_ROWS } from '@order/shared/constants/company';

/** 개인정보처리방침은 브랜드 사이트에서 관리한다. */
const PRIVACY_URL = 'https://www.tacomole.kr/privacy';

export default function SiteFooter() {
    return (
        <footer className="border-t border-gray-100 px-4 py-5 text-xs text-gray-400">
            <div className="max-w-[568px] mx-auto space-y-3">
                <nav className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link href="/terms" className="hover:text-gray-600">이용약관</Link>
                    <span className="text-gray-200">·</span>
                    <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="hover:text-gray-600">
                        개인정보처리방침
                    </a>
                    <span className="text-gray-200">·</span>
                    <Link href="/refund-policy" className="hover:text-gray-600">취소·환불 정책</Link>
                </nav>

                <details className="group">
                    <summary className="cursor-pointer list-none select-none text-gray-400 hover:text-gray-600">
                        사업자정보 <span className="text-gray-300 group-open:hidden">▾</span>
                        <span className="hidden text-gray-300 group-open:inline">▴</span>
                    </summary>
                    <dl className="mt-2 space-y-1 leading-relaxed">
                        {COMPANY_INFO_ROWS.map(([label, value]) => (
                            <div key={label} className="flex gap-2">
                                <dt className="w-24 flex-shrink-0 text-gray-300">{label}</dt>
                                <dd className="flex-1 text-gray-400">{value}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-2 text-gray-300">
                        {COMPANY.nameShort}는 타코몰리 브랜드 매장에서 직접 조리·판매하는 통신판매업자이며, 판매 상품에 대한
                        책임을 집니다.
                    </p>
                </details>
            </div>
        </footer>
    );
}
