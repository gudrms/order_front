import Link from 'next/link';
import { Menu, MapPin, Phone } from 'lucide-react';

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full bg-brand-black text-white border-b border-brand-yellow/20">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center text-brand-black font-bold text-xl group-hover:scale-110 transition-transform">
                        T
                    </div>
                    <span className="text-2xl font-bold tracking-tighter text-brand-yellow">
                        TACO MOLLY
                    </span>
                </Link>

                {/* Desktop Navigation (Yupdduk Structure) */}
                <nav className="hidden md:flex items-center gap-8 font-medium">
                    <Link href="#brand" className="hover:text-brand-yellow transition-colors">브랜드 소개</Link>
                    <Link href="#menu" className="hover:text-brand-yellow transition-colors">메뉴 소개</Link>
                    <Link href="#store" className="hover:text-brand-yellow transition-colors">매장 찾기</Link>
                    <Link href="#franchise" className="hover:text-brand-yellow transition-colors">가맹 문의</Link>
                    <Link href="#event" className="hover:text-brand-yellow transition-colors">이벤트</Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <button className="hidden md:flex items-center gap-2 bg-brand-yellow text-brand-black px-5 py-2.5 rounded-full font-bold hover:bg-white hover:text-brand-green transition-all transform hover:-translate-y-0.5 shadow-lg shadow-brand-yellow/20">
                        <Phone size={18} />
                        <span>주문하기</span>
                    </button>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2 text-white hover:text-brand-yellow">
                        <Menu size={24} />
                    </button>
                </div>
            </div>
        </header>
    );
}
