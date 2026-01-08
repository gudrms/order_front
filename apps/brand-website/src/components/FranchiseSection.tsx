import Link from 'next/link';
import { TrendingUp, Users, Store, DollarSign } from 'lucide-react';

export default function FranchiseSection() {
    return (
        <section id="franchise" className="py-20 bg-brand-yellow/10">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Left Content */}
                    <div className="flex-1">
                        <h2 className="text-brand-green font-bold tracking-widest mb-2">FRANCHISE</h2>
                        <h3 className="text-4xl font-black text-brand-black mb-6 leading-tight">
                            성공하는 창업,<br />
                            <span className="text-brand-green">타코몰리</span>와 함께하세요.
                        </h3>
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                            체계적인 교육 시스템과 차별화된 맛으로<br />
                            점주님의 성공적인 창업을 지원합니다.<br />
                            지금 바로 가맹 상담을 받아보세요.
                        </p>

                        <div className="grid grid-cols-2 gap-6 mb-10">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-yellow/20">
                                <Store className="text-brand-yellow mb-3" size={32} />
                                <div className="text-2xl font-black text-brand-black mb-1">7호점</div>
                                <div className="text-gray-500 text-sm">돌파</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-yellow/20">
                                <TrendingUp className="text-brand-green mb-3" size={32} />
                                <div className="text-2xl font-black text-brand-black mb-1">30%</div>
                                <div className="text-gray-500 text-sm">평균 수익률</div>
                            </div>
                        </div>

                        <Link 
                            href="/franchise"
                            className="inline-block w-full sm:w-auto px-8 py-4 bg-brand-green text-white font-bold text-lg rounded-full hover:bg-brand-black transition-colors shadow-lg shadow-brand-green/20 text-center"
                        >
                            가맹 상담 신청하기
                        </Link>
                    </div>

                    {/* Right Image */}
                    <div className="flex-1 relative">
                        <div className="absolute -inset-4 bg-brand-yellow/30 rounded-3xl transform rotate-3" />
                        <div className="relative bg-white p-2 rounded-2xl shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=800&auto=format&fit=crop"
                                alt="Store Interior"
                                className="rounded-xl w-full h-auto"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
