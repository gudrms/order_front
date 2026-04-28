'use client';

import { Bell, ChevronDown, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAddresses } from '@/hooks/queries/useAddresses';

export default function HomeHeader() {
    const router = useRouter();
    const { user } = useAuth();
    const { data: addresses = [] } = useAddresses(user?.id);
    const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0];

    return (
        <header className="bg-white">
            <button
                type="button"
                onClick={() => router.push(user ? '/mypage/address' : '/login')}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 text-left"
            >
                <div className="flex items-center gap-1 min-w-0">
                    <MapPin size={20} className="text-brand-black flex-shrink-0" />
                    <span className="font-bold text-lg text-brand-black truncate">
                        {defaultAddress?.address || '배달 주소를 설정해주세요'}
                    </span>
                    <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                </div>
                <Bell size={24} className="text-brand-black flex-shrink-0" />
            </button>

            <div className="relative w-full aspect-[2/1] bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=800&auto=format&fit=crop"
                    alt="이벤트 배너"
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                    1 / 5 | 전체보기
                </div>
            </div>
        </header>
    );
}
