"use client";

import { X, Minus, Plus } from 'lucide-react';

export default function MenuDetail() {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 pointer-events-auto" />

            {/* Bottom Sheet */}
            <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl p-6 pointer-events-auto animate-slide-up max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-brand-black mb-2">타코몰리 시그니처 타코</h2>
                        <p className="text-gray-500 text-sm">직화구이 고기와 신선한 살사의 조화</p>
                    </div>
                    <button className="p-2 -mr-2 text-gray-400 hover:text-brand-black">
                        <X size={24} />
                    </button>
                </div>

                {/* Options - Spiciness */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                        맵기 선택 <span className="text-brand-yellow text-xs font-normal bg-brand-yellow/10 px-2 py-0.5 rounded-full">필수</span>
                    </h3>
                    <div className="space-y-3">
                        {["1단계 (순한맛)", "2단계 (신라면)", "3단계 (불닭)", "4단계 (핵불닭)"].map((level, idx) => (
                            <label key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-brand-yellow hover:bg-brand-yellow/5 transition-colors">
                                <input type="radio" name="spiciness" className="w-5 h-5 text-brand-yellow focus:ring-brand-yellow" defaultChecked={idx === 0} />
                                <span className="font-medium text-brand-black">{level}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Options - Toppings */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-4">토핑 추가</h3>
                    <div className="space-y-3">
                        {[
                            { name: "치즈 추가", price: "+1,000원" },
                            { name: "과카몰리 추가", price: "+2,000원" },
                            { name: "고수 따로", price: "+0원" }
                        ].map((topping, idx) => (
                            <label key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-brand-green hover:bg-brand-green/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="w-5 h-5 text-brand-green rounded focus:ring-brand-green" />
                                    <span className="font-medium text-brand-black">{topping.name}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-500">{topping.price}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Quantity & Button */}
                <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-bold text-lg">수량</span>
                        <div className="flex items-center gap-4 bg-gray-100 rounded-full px-4 py-2">
                            <button className="w-6 h-6 flex items-center justify-center text-gray-500"><Minus size={16} /></button>
                            <span className="font-bold text-lg">1</span>
                            <button className="w-6 h-6 flex items-center justify-center text-brand-black"><Plus size={16} /></button>
                        </div>
                    </div>

                    <button className="w-full bg-brand-yellow text-brand-black font-black text-xl py-4 rounded-2xl shadow-lg shadow-brand-yellow/20 hover:bg-brand-black hover:text-white transition-colors">
                        12,000원 담기
                    </button>
                </div>

            </div>
        </div>
    );
}
