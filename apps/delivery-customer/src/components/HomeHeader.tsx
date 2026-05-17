'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, ChevronDown, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAddresses } from '@/hooks/queries/useAddresses';

const BANNERS = [
    {
        id: 1,
        bg: 'from-brand-yellow to-orange-400',
        title: '타코몰리에 오신 걸 환영해요',
        subtitle: '지금 주문하면 배달비 무료!',
        badge: '기간 한정',
    },
    {
        id: 2,
        bg: 'from-brand-green to-emerald-700',
        title: '방문포장 3,000원 할인',
        subtitle: '직접 오시면 더 저렴하게',
        badge: '포장 혜택',
    },
    {
        id: 3,
        bg: 'from-gray-800 to-brand-black',
        title: '신메뉴 출시',
        subtitle: '시그니처 타코 버라이어티팩',
        badge: 'NEW',
    },
];

export default function HomeHeader() {
    const router = useRouter();
    const { user } = useAuth();
    const { data: addresses = [] } = useAddresses(user?.id);
    const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

    const [current, setCurrent] = useState(0);
    const startX = useRef<number | null>(null);

    const next = useCallback(() => setCurrent((c) => (c + 1) % BANNERS.length), []);
    const prev = useCallback(() => setCurrent((c) => (c - 1 + BANNERS.length) % BANNERS.length), []);

    useEffect(() => {
        const id = setInterval(next, 3500);
        return () => clearInterval(id);
    }, [next]);

    return (
        <header className="bg-white">
            {/* 주소 바 */}
            <button
                type="button"
                onClick={() => router.push(user ? '/mypage/address' : '/login')}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 text-left"
            >
                <div className="flex items-center gap-1 min-w-0">
                    <MapPin size={20} className="text-brand-black flex-shrink-0" />
                    <span className="font-bold text-base text-brand-black truncate">
                        {defaultAddress?.address || '배달 주소를 설정해주세요'}
                    </span>
                    <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                </div>
                <Bell size={22} className="text-brand-black flex-shrink-0" />
            </button>

            {/* 배너 캐러셀 */}
            <div
                className="relative w-full aspect-[2/1] overflow-hidden select-none"
                onPointerDown={(e) => { startX.current = e.clientX; }}
                onPointerUp={(e) => {
                    if (startX.current === null) return;
                    const dx = e.clientX - startX.current;
                    if (dx < -40) next();
                    else if (dx > 40) prev();
                    startX.current = null;
                }}
            >
                <div
                    className="flex h-full transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${current * 100}%)` }}
                >
                    {BANNERS.map((b) => (
                        <div
                            key={b.id}
                            className={`min-w-full h-full bg-gradient-to-br ${b.bg} flex flex-col items-start justify-end p-6`}
                        >
                            <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full mb-2">
                                {b.badge}
                            </span>
                            <p className="text-white/80 text-sm mb-1">{b.subtitle}</p>
                            <h2 className="text-white text-2xl font-black">{b.title}</h2>
                        </div>
                    ))}
                </div>

                {/* 슬라이드 인디케이터 (점) */}
                <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                    {BANNERS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`}
                        />
                    ))}
                </div>

                {/* 슬라이드 번호 */}
                <div className="absolute bottom-3 right-4">
                    <span className="bg-black/40 text-white text-xs px-3 py-1 rounded-full">
                        {String(current + 1).padStart(2, '0')} / {String(BANNERS.length).padStart(2, '0')}
                    </span>
                </div>
            </div>
        </header>
    );
}
