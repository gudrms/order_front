import { MapPin, ChevronDown, Bell } from 'lucide-react';

export default function HomeHeader() {
    return (
        <header className="bg-white">
            {/* Address Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-1">
                    <MapPin size={20} className="text-brand-black" />
                    <span className="font-bold text-lg text-brand-black">서울 강남구 테헤란로 123</span>
                    <ChevronDown size={20} className="text-gray-400" />
                </div>
                <Bell size={24} className="text-brand-black" />
            </div>

            {/* Main Banner */}
            <div className="relative w-full aspect-[2/1] bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=800&auto=format&fit=crop"
                    alt="Event Banner"
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                    1 / 5 | 전체보기
                </div>
            </div>
        </header>
    );
}
