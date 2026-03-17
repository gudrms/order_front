'use client';

import { Home, FileText, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 flex justify-between items-center z-50 max-w-[600px] mx-auto">
            <Link href="/" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname === '/' ? 'text-brand-black' : 'text-gray-300 hover:text-brand-black'}`}>
                <Home size={24} fill={pathname === '/' ? "currentColor" : "none"} />
                <span className="text-[10px] font-bold">홈</span>
            </Link>
            <Link href="/orders" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname?.startsWith('/orders') ? 'text-brand-black' : 'text-gray-300 hover:text-brand-black'}`}>
                <FileText size={24} fill={pathname?.startsWith('/orders') ? "currentColor" : "none"} />
                <span className="text-[10px] font-bold">주문내역</span>
            </Link>
            <Link href="/mypage" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname?.startsWith('/mypage') ? 'text-brand-black' : 'text-gray-300 hover:text-brand-black'}`}>
                <User size={24} fill={pathname?.startsWith('/mypage') ? "currentColor" : "none"} />
                <span className="text-[10px] font-bold">마이</span>
            </Link>
        </nav>
    );
}
