import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-50 text-gray-800 py-16 border-t border-gray-200">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                    {/* Brand Info */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center text-brand-black font-bold shadow-sm">T</div>
                            <span className="text-xl font-bold text-brand-black">TACO MOLE</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-6 max-w-md">
                            타코몰리는 멕시코의 정통 맛을 한국인의 입맛에 맞게 재해석한
                            캐주얼 멕시칸 다이닝 브랜드입니다.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-brand-green">MENU</h4>
                        <ul className="space-y-3 text-gray-500">
                            <li><Link href="/menu" className="hover:text-brand-green transition-colors">타코 & 부리또</Link></li>
                            <li><Link href="/menu" className="hover:text-brand-green transition-colors">퀘사디아</Link></li>
                            <li><Link href="/menu" className="hover:text-brand-green transition-colors">사이드 & 음료</Link></li>
                            <li><Link href="/menu" className="hover:text-brand-green transition-colors">세트 메뉴</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-brand-green">CONTACT</h4>
                        <ul className="space-y-3 text-gray-500">
                            <li>가맹문의: 010-4593-0731</li>
                            <li>이메일: tacomole26@gmail.com</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; 2024 TACO MOLE. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <span className="cursor-pointer hover:text-brand-black">이용약관</span>
                        <span className="cursor-pointer hover:text-brand-black">개인정보처리방침</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
