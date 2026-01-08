import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, MapPin, Phone, Clock } from 'lucide-react';

const STORES = [
    {
        name: "타코몰리 홍대본점",
        address: "서울시 마포구 어울마당로 123",
        phone: "02-1234-5678",
        hours: "11:00 - 22:00",
        distance: "0.5km"
    },
    {
        name: "타코몰리 강남점",
        address: "서울시 강남구 테헤란로 456",
        phone: "02-8765-4321",
        hours: "11:00 - 23:00",
        distance: "3.2km"
    }
];

export default function StorePage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            
            <section className="py-20 bg-brand-black text-center">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">STORE</h1>
                <p className="text-brand-yellow font-bold">가까운 타코몰리 매장을 확인해보세요.</p>
            </section>

            <section className="py-12 border-b border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto flex gap-2">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                placeholder="지역 또는 매장명을 입력하세요"
                                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-brand-green outline-none transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <button className="px-8 py-4 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-black transition-colors">
                            검색
                        </button>
                    </div>
                </div>
            </section>

            <section className="flex flex-col lg:flex-row h-[700px]">
                {/* Store List */}
                <div className="w-full lg:w-[450px] overflow-y-auto bg-gray-50 border-r border-gray-200">
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-6">검색 결과 <span className="text-brand-green font-bold">{STORES.length}</span>건</p>
                        
                        <div className="space-y-4">
                            {STORES.map((store, index) => (
                                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-brand-green cursor-pointer transition-all group">
                                    <h3 className="text-xl font-bold text-brand-black mb-3 group-hover:text-brand-green transition-colors">{store.name}</h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-brand-yellow" />
                                            <span>{store.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-brand-yellow" />
                                            <span>{store.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-brand-yellow" />
                                            <span>{store.hours}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-brand-green font-bold">{store.distance}</span>
                                        <button className="text-xs font-bold text-gray-400 hover:text-brand-black">상세보기 &gt;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map Placeholder */}
                <div className="flex-1 bg-gray-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 flex-col gap-4">
                        <MapPin size={48} />
                        <p className="font-bold">지도 API 연동 예정입니다.</p>
                        <p className="text-sm">(Kakao Map SDK 적용 예정)</p>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
