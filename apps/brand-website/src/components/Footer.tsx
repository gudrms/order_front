export default function Footer() {
    return (
        <footer className="bg-brand-black text-white py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                    {/* Brand Info */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center text-brand-black font-bold">T</div>
                            <span className="text-xl font-bold text-brand-yellow">TACO MOLLY</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                            타코몰리는 멕시코의 정통 맛을 한국인의 입맛에 맞게 재해석한
                            캐주얼 멕시칸 다이닝 브랜드입니다.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-brand-yellow">MENU</h4>
                        <ul className="space-y-3 text-gray-400">
                            <li><a href="#" className="hover:text-white transition-colors">타코 & 부리또</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">퀘사디아</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">사이드 & 음료</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">세트 메뉴</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-brand-yellow">CONTACT</h4>
                        <ul className="space-y-3 text-gray-400">
                            <li>가맹문의: 1588-0000</li>
                            <li>고객센터: 02-1234-5678</li>
                            <li>이메일: franchise@tacomolly.com</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; 2024 TACO MOLLY. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white">이용약관</a>
                        <a href="#" className="hover:text-white">개인정보처리방침</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
