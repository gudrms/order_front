import { ChevronRight } from 'lucide-react';

export default function Dashboard() {
    return (
        <section className="px-4 py-6 bg-white rounded-b-3xl shadow-sm mb-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-brand-black">
                    김타코님, 반갑습니다.
                </h2>
                <ChevronRight className="text-gray-400" />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="w-5 h-5 rounded-full bg-brand-yellow flex items-center justify-center text-[10px] font-bold">P</span>
                        <span className="text-sm font-bold text-brand-black">포인트</span>
                    </div>
                    <span className="text-2xl font-black text-brand-black">1,200P</span>
                </div>

                <div className="flex flex-col items-center border-l border-gray-100">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center text-[10px] font-bold text-white">C</span>
                        <span className="text-sm font-bold text-brand-black">쿠폰</span>
                    </div>
                    <span className="text-2xl font-black text-brand-black">2장</span>
                </div>

                <div className="flex flex-col items-center border-l border-gray-100">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">G</span>
                        <span className="text-sm font-bold text-brand-black">선물함</span>
                    </div>
                    <span className="text-2xl font-black text-gray-300">0매</span>
                </div>
            </div>
        </section>
    );
}
