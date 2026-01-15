'use client';

import { useActionState, useEffect } from 'react';
import { submitFranchiseInquiry } from './actions';

const initialState = {
    success: false,
    message: '',
};

export default function FranchiseContent() {
    const [state, formAction, isPending] = useActionState(submitFranchiseInquiry, initialState);

    // Reset form or show alert based on state
    useEffect(() => {
        if (state.message) {
            alert(state.message);
            if (state.success) {
                // Optional: Reset form fields if needed
            }
        }
    }, [state]);

    return (
        <main className="min-h-screen bg-white text-brand-black">
            {/* Hero */}
            <section className="py-20 bg-brand-yellow text-brand-black text-center px-4">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">FRANCHISE</h1>
                <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto">
                    타코몰리와 함께 성공적인 창업의 꿈을 이루세요.
                </p>
            </section>

            <div className="container mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Info Section */}
                <div className="space-y-12">
                    <div>
                        <h2 className="text-3xl font-bold text-brand-black mb-6">Why TACO MOLE?</h2>
                        <ul className="space-y-6">
                            {[
                                { title: '검증된 맛과 메뉴', desc: '남녀노소 누구나 좋아하는 대중적인 멕시칸 푸드' },
                                { title: '쉬운 조리 시스템', desc: '초보자도 1주일 교육이면 마스터 가능한 레시피' },
                                { title: '높은 수익률', desc: '효율적인 식자재 관리와 낮은 원가율' },
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <div className="w-12 h-12 bg-brand-black rounded-full flex items-center justify-center text-brand-yellow font-bold text-xl shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-brand-green mb-2">{item.title}</h3>
                                        <p className="text-gray-600">{item.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                        <h3 className="text-xl font-bold text-brand-black mb-4">가맹 개설 비용</h3>
                        <div className="space-y-4 text-gray-600">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span>가맹비</span>
                                <span className="text-brand-black font-bold">1,000 만원</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span>교육비</span>
                                <span className="text-brand-black font-bold">500 만원</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span>인테리어 (15평 기준)</span>
                                <span className="text-brand-black font-bold">3,500 만원</span>
                            </div>
                            <div className="flex justify-between pt-2 text-lg">
                                <span className="text-brand-green font-bold">총 예상 비용</span>
                                <span className="text-brand-green font-bold">5,000 만원</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">* 점포 임대료 및 별도 공사 비용 제외</p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="bg-white text-brand-black p-8 md:p-10 rounded-3xl shadow-2xl">
                    <h2 className="text-3xl font-bold mb-2">가맹 상담 신청</h2>
                    <p className="text-gray-600 mb-8">정보를 남겨주시면 상세한 안내 자료를 보내드립니다.</p>

                    <form action={formAction} className="space-y-6">
                        {/* Honeypot Field (Hidden) */}
                        <div className="hidden" aria-hidden="true">
                            <label htmlFor="website">Website</label>
                            <input
                                type="text"
                                name="website"
                                id="website"
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">이름</label>
                            <input
                                name="name"
                                type="text"
                                required
                                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green transition-colors"
                                placeholder="홍길동"
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">연락처</label>
                            <input
                                name="phone"
                                type="tel"
                                required
                                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green transition-colors"
                                placeholder="010-1234-5678"
                                maxLength={11}
                                onInput={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    target.value = target.value.replace(/[^0-9]/g, '');
                                }}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">이메일</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green transition-colors"
                                placeholder="example@email.com"
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">희망 창업 지역</label>
                            <input
                                name="area"
                                type="text"
                                required
                                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green transition-colors"
                                placeholder="서울시 강남구"
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">문의 내용</label>
                            <textarea
                                name="message"
                                rows={4}
                                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green transition-colors resize-none"
                                placeholder="궁금하신 점을 자유롭게 적어주세요."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-brand-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? '전송 중...' : '상담 신청하기'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
