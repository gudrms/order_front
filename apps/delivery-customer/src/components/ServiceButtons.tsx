import { Bike, ShoppingBag } from 'lucide-react';

interface Props {
    onDelivery: () => void;
    onTakeout: () => void;
}

export default function ServiceButtons({ onDelivery, onTakeout }: Props) {
    return (
        <section className="px-4 pt-4 pb-2">
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onDelivery}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-2.5 relative overflow-hidden active:scale-95 transition-transform"
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-yellow" />
                    <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center text-brand-yellow mt-1">
                        <Bike size={30} />
                    </div>
                    <span className="font-black text-base text-brand-black">배달주문</span>
                    <span className="text-xs bg-brand-yellow/10 text-brand-yellow font-bold px-3 py-0.5 rounded-full">
                        배달비 무료
                    </span>
                </button>

                <button
                    onClick={onTakeout}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-2.5 relative overflow-hidden active:scale-95 transition-transform"
                >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-green" />
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-brand-green mt-1">
                        <ShoppingBag size={30} />
                    </div>
                    <span className="font-black text-base text-brand-black">방문포장</span>
                    <span className="text-xs bg-green-50 text-brand-green font-bold px-3 py-0.5 rounded-full">
                        3,000원 할인
                    </span>
                </button>
            </div>
        </section>
    );
}
