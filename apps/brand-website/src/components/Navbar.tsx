'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, MapPin, Phone } from 'lucide-react';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const deliveryUrl = process.env.NEXT_PUBLIC_DELIVERY_URL || 'http://localhost:3001';

    return (
        <header className="sticky top-0 z-50 w-full bg-white text-brand-black border-b border-gray-100 shadow-sm">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center text-brand-black font-bold text-xl group-hover:scale-110 transition-transform shadow-md">
                        T
                    </div>
                    <span className="text-2xl font-bold tracking-tighter text-brand-black">
                        TACO MOLE
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 font-medium text-gray-600">
                    <Link href="/brand" className="hover:text-brand-green transition-colors font-bold">브랜드 소개</Link>
                    <Link href="/menu" className="hover:text-brand-green transition-colors font-bold">메뉴 소개</Link>
                    <Link href="/store" className="hover:text-brand-green transition-colors font-bold">매장 찾기</Link>
                    <Link href="/franchise" className="hover:text-brand-green transition-colors font-bold">가맹 문의</Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        href={deliveryUrl}
                        target="_blank"
                        className="hidden md:flex items-center gap-2 bg-brand-green text-white px-5 py-2.5 rounded-full font-bold hover:bg-brand-black transition-all transform hover:-translate-y-0.5 shadow-lg shadow-brand-green/20"
                    >
                        <Phone size={18} />
                        <span>주문하기</span>
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-brand-black hover:text-brand-green"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 p-4 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-5 z-50">
                    <Link
                        href="/brand"
                        className="p-2 hover:text-brand-green transition-colors border-b border-gray-100 font-bold"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        브랜드 소개
                    </Link>
                    <Link
                        href="/menu"
                        className="p-2 hover:text-brand-green transition-colors border-b border-gray-100 font-bold"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        메뉴 소개
                    </Link>
                    <Link
                        href="/store"
                        className="p-2 hover:text-brand-green transition-colors border-b border-gray-100 font-bold"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        매장 찾기
                    </Link>
                    <Link
                        href="/franchise"
                        className="p-2 hover:text-brand-green transition-colors border-b border-gray-100 font-bold"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        가맹 문의
                    </Link>
                    <Link
                        href={deliveryUrl}
                        target="_blank"
                        className="flex items-center justify-center gap-2 bg-brand-green text-white p-3 rounded-lg font-bold hover:bg-brand-black transition-colors mt-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <Phone size={18} />
                        <span>주문하기</span>
                    </Link>
                </div>
            )}
        </header>
    );
}
