import { Gift, Clock } from 'lucide-react';

export default function QuickMenu() {
    return (
        <section className="px-4 mb-24">
            <button className="w-full bg-brand-yellow text-brand-black p-4 rounded-xl font-bold flex items-center justify-between shadow-md shadow-brand-yellow/20 mb-4">
                <div className="flex items-center gap-3">
                    <Gift size={24} />
                    <span className="text-lg">타코몰리 선물하기</span>
                </div>
                <span className="text-sm opacity-80">소중한 마음을 전해요! &gt;</span>
            </button>

            <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-400 mb-4 text-sm">원클릭 주문</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-400 mb-1">2026.01.05</div>
                        <div className="font-bold text-lg text-brand-black mb-1">타코 파티팩 외 2건</div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin size={14} />
                            <span>김포점</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block bg-brand-yellow/20 text-brand-black text-xs font-bold px-2 py-1 rounded mb-1 inline-block">배달주문</span>
                        <div className="font-bold text-brand-yellow text-lg">24,000원</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
