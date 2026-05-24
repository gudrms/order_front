'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, ChevronDown, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAddresses } from '@/hooks/queries/useAddresses';
import { useBrandBanners, BrandBanner } from '@/hooks/queries/useBrandBanners';

export default function HomeHeader() {
    const router = useRouter();
    const { user } = useAuth();
    const { data: addresses = [] } = useAddresses(user?.id);
    const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

    const { data: banners = [], isLoading } = useBrandBanners();

    const [current, setCurrent] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const isVerticalScroll = useRef<boolean>(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const next = useCallback(() => {
        if (banners.length === 0) return;
        setCurrent((c) => (c + 1) % banners.length);
    }, [banners.length]);

    const prev = useCallback(() => {
        if (banners.length === 0) return;
        setCurrent((c) => (c - 1 + banners.length) % banners.length);
    }, [banners.length]);

    useEffect(() => {
        if (banners.length <= 1 || isDragging) return;
        const id = setInterval(next, 4000);
        return () => clearInterval(id);
    }, [next, banners.length, isDragging]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (banners.length <= 1) return;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isVerticalScroll.current = false;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null || !containerRef.current || banners.length <= 1) return;
        if (isVerticalScroll.current) return;

        const deltaX = e.touches[0].clientX - touchStartX.current;
        const deltaY = e.touches[0].clientY - touchStartY.current;

        // 세로 움직임이 가로 움직임보다 크고 충분히 크면 세로 스크롤로 판단하여 캐러셀 드래그 무시
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
            isVerticalScroll.current = true;
            setIsDragging(false);
            setDragOffset(0);
            return;
        }

        const containerWidth = containerRef.current.offsetWidth;
        const offsetPercent = (deltaX / containerWidth) * 100;
        
        // Apply resistance if dragging past boundaries
        if (current === 0 && deltaX > 0) {
            setDragOffset(offsetPercent * 0.4);
        } else if (current === banners.length - 1 && deltaX < 0) {
            setDragOffset(offsetPercent * 0.4);
        } else {
            setDragOffset(offsetPercent);
        }
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null || banners.length <= 1) return;
        setIsDragging(false);
        
        if (!isVerticalScroll.current) {
            if (dragOffset < -15) {
                next();
            } else if (dragOffset > 15) {
                prev();
            }
        }
        
        setDragOffset(0);
        touchStartX.current = null;
        touchStartY.current = null;
        isVerticalScroll.current = false;
    };

    const handleBannerClick = (banner: BrandBanner) => {
        // Only trigger click if the user wasn't dragging
        if (Math.abs(dragOffset) > 2) return;

        if (banner.linkType === 'STORE' && banner.storeId) {
            router.push(`/store/${banner.storeId}/menu`);
        } else if (banner.linkType === 'EXTERNAL' && banner.linkUrl) {
            if (banner.linkUrl.startsWith('/')) {
                router.push(banner.linkUrl);
            } else {
                window.open(banner.linkUrl, '_blank');
            }
        }
    };

    return (
        <header className="bg-white pt-safe">
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
                ref={containerRef}
                className="relative w-full aspect-[2/1] overflow-hidden select-none bg-gray-50 touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                {isLoading ? (
                    <div className="w-full h-full bg-gray-100 animate-pulse flex flex-col justify-end p-6">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-32 mb-1" />
                        <div className="h-6 bg-gray-200 rounded w-48" />
                    </div>
                ) : banners.length > 0 ? (
                    <>
                        <div
                            className="flex h-full"
                            style={{
                                transform: `translateX(calc(-${current * 100}% + ${dragOffset}%))`,
                                transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            }}
                        >
                            {banners.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => handleBannerClick(b)}
                                    className="min-w-full h-full flex flex-col items-start justify-end p-6 text-left relative overflow-hidden group outline-none active:scale-[0.99] transition-transform"
                                    style={
                                        b.bgType === 'GRADIENT' && b.bgStartColor && b.bgEndColor
                                            ? { background: `linear-gradient(135deg, ${b.bgStartColor}, ${b.bgEndColor})` }
                                            : b.bgType === 'IMAGE' && b.imageUrl
                                            ? { backgroundImage: `url(${b.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                            : { background: 'linear-gradient(135deg, #E5E7EB, #D1D5DB)' }
                                    }
                                >
                                    {b.badge && (
                                        <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full mb-2">
                                            {b.badge}
                                        </span>
                                    )}
                                    {b.subtitle && (
                                        <p className="text-white/85 text-xs md:text-sm mb-1 font-medium drop-shadow-sm">
                                            {b.subtitle}
                                        </p>
                                    )}
                                    <h2 className="text-white text-xl md:text-2xl font-black leading-tight drop-shadow-sm">
                                        {b.title}
                                    </h2>
                                </button>
                            ))}
                        </div>

                        {/* 슬라이드 인디케이터 (점) */}
                        {banners.length > 1 && (
                            <div className="absolute bottom-3 left-4 flex items-center gap-1.5 z-10 pointer-events-none">
                                {banners.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all ${
                                            i === current ? 'bg-white w-4' : 'bg-white/40 w-1.5'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 슬라이드 번호 */}
                        {banners.length > 1 && (
                            <div className="absolute bottom-3 right-4 z-10 pointer-events-none">
                                <span className="bg-black/40 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                                    {String(current + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}
                                </span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-yellow to-orange-400 flex flex-col items-start justify-end p-6 text-left">
                        <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full mb-2">
                            Welcome
                        </span>
                        <p className="text-white/85 text-xs mb-1 font-medium">부담없이 맛있는 멕시칸 푸드</p>
                        <h2 className="text-white text-xl font-black">맛있는 즐거움, 타코몰리</h2>
                    </div>
                )}
            </div>
        </header>
    );
}
