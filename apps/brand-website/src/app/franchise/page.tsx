import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';

export default function FranchisePage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            
            <section className="py-24 bg-brand-black text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2880&auto=format&fit=crop')] bg-cover bg-center" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6">성공의 동반자,<br />타코몰리와 함께하세요</h1>
                    <p className="text-brand-yellow text-xl font-bold">체계적인 시스템으로 예비 창업주의 성공을 지원합니다.</p>
                </div>
            </section>

            {/* Why Tacomoly */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-black text-center mb-16">타코몰리만의 <span className="text-brand-green">차별화된 경쟁력</span></h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-gray-50 p-10 rounded-3xl text-center hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-brand-yellow/30 group">
                            <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <TrendingUp className="text-brand-black" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">안정적인 수익구조</h3>
                            <p className="text-gray-600">낮은 원가율과 효율적인 오퍼레이션으로 극대화된 수익률을 보장합니다.</p>
                        </div>
                        <div className="bg-gray-50 p-10 rounded-3xl text-center hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-brand-yellow/30 group">
                            <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Users className="text-white" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">체계적인 교육</h3>
                            <p className="text-gray-600">초보 창업자도 전문가가 될 수 있도록 1:1 전담 교육 시스템을 제공합니다.</p>
                        </div>
                        <div className="bg-gray-50 p-10 rounded-3xl text-center hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-brand-yellow/30 group">
                            <div className="w-16 h-16 bg-brand-black rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="text-brand-yellow" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">트렌디한 브랜딩</h3>
                            <p className="text-gray-600">MZ세대를 사로잡는 감각적인 인테리어와 압도적인 비주얼의 메뉴.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Procedure */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-black text-center mb-16">창업 절차</h2>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative">
                        {[
                            { step: '01', title: '가맹상담', desc: '사업 계획 및 시장 분석' },
                            { step: '02', title: '점포개발', desc: '입지 분석 및 상권 확인' },
                            { step: '03', title: '가맹계약', desc: '정보공개서 및 계약 체결' },
                            { step: '04', title: '인테리어', desc: '공사 진행 및 기기 입고' },
                            { step: '05', title: '교육 및 오픈', desc: '운영 교육 후 정식 오픈' }
                        ].map((item, idx, arr) => (
                            <div key={idx} className="flex-1 text-center relative z-10">
                                <div className="w-16 h-16 bg-white border-2 border-brand-green text-brand-green rounded-full flex items-center justify-center mx-auto mb-6 font-black text-xl shadow-sm">
                                    {item.step}
                                </div>
                                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                                <p className="text-gray-500 text-sm">{item.desc}</p>
                                {idx < arr.length - 1 && (
                                    <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gray-200" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form */}
            <section className="py-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="bg-white rounded-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                        <div className="bg-brand-green p-12 text-white md:w-1/3">
                            <h2 className="text-3xl font-black mb-6">가맹 상담<br />신청하기</h2>
                            <p className="text-brand-yellow font-bold mb-8">빠른 시일 내에 전문가가 연락드리겠습니다.</p>
                            <div className="space-y-4 text-sm">
                                <p className="flex items-center gap-2 opacity-80"><Phone size={16} /> 1588-0000</p>
                                <p className="flex items-center gap-2 opacity-80"><CheckCircle2 size={16} /> 24시간 온라인 접수 가능</p>
                            </div>
                        </div>
                        <div className="p-12 md:w-2/3">
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">이름</label>
                                        <input type="text" className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-brand-green/20" placeholder="성함을 입력하세요" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">연락처</label>
                                        <input type="text" className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-brand-green/20" placeholder="010-0000-0000" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">희망 지역</label>
                                    <input type="text" className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-brand-green/20" placeholder="예: 서울 마포구" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">문의 내용 (선택)</label>
                                    <textarea className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-brand-green/20 h-32" placeholder="궁금하신 사항을 입력해주세요"></textarea>
                                </div>
                                <button className="w-full py-4 bg-brand-black text-white font-black rounded-xl hover:bg-brand-green transition-colors shadow-lg">
                                    상담 신청하기
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
