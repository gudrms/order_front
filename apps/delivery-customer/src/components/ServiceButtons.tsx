import { Bike, ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';

export default function ServiceButtons() {
    return (
        <section className="px-4 py-6">
            <div className="grid grid-cols-3 gap-3">
                {/* Delivery */}
                <Link href="/menu">
                    <button className="aspect-[3/4] bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-brand-yellow" />
                        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-brand-yellow mb-1 group-hover:scale-110 transition-transform">
                            <Bike size={32} />
                        </div>
                        <span className="font-black text-lg text-brand-black">배달주문</span>
                        <div className="absolute top-3 left-3 bg-brand-yellow text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            배달비 무료
                        </div>
                    </button>
                </Link>

                {/* Takeout */}
                <button className="aspect-[3/4] bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-green" />
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-brand-green mb-1 group-hover:scale-110 transition-transform">
                        <ShoppingBag size={32} />
                    </div>
                    <span className="font-black text-lg text-brand-black">포장주문</span>
                    <div className="absolute top-3 left-3 bg-brand-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        3,000원 할인
                    </div>
                </button>

                {/* Store */}
                <button className="aspect-[3/4] bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-black" />
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-brand-black mb-1 group-hover:scale-110 transition-transform">
                        <Store size={32} />
                    </div>
                    <span className="font-black text-lg text-brand-black">매장식사</span>
                    <div className="absolute top-3 left-3 bg-brand-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        2,000원 할인
                    </div>
                </button>
            </div>
        </section>
    );
}
