'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Clock, ChevronRight, Heart, Bike, Gift } from 'lucide-react';
import { getAllStores } from '@order/shared/api';
import type { Store } from '@order/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteStores } from '@/hooks/useFavoriteStores';
import BottomNav from '@/components/BottomNav';
import HomeHeader from '@/components/HomeHeader';
import ServiceButtons from '@/components/ServiceButtons';

type OrderType = 'delivery' | 'takeout';

export default function Home() {
    const router = useRouter();
    const { user } = useAuth();
    const { favoriteStoreIds, toggle: toggleFavorite, isLoggedIn } = useFavoriteStores();
    const [searchQuery, setSearchQuery] = useState('');
    const [orderType, setOrderType] = useState<OrderType>('delivery');
    const storesSectionRef = useRef<HTMLDivElement>(null);

    const { data: stores = [], isLoading } = useQuery({
        queryKey: ['delivery-stores'],
        queryFn: getAllStores,
        staleTime: 5 * 60 * 1000,
    });

    const activeStores = stores.filter((s) => s.isActive);
    const filteredByType =
        orderType === 'delivery' ? activeStores.filter((s) => s.isDeliveryEnabled) : activeStores;

    const filteredStores = searchQuery
        ? filteredByType.filter(
              (s) =>
                  s.name.includes(searchQuery) ||
                  s.address?.includes(searchQuery) ||
                  s.branchName?.includes(searchQuery),
          )
        : filteredByType;

    const favoriteStores = filteredByType.filter((s) => favoriteStoreIds.has(s.id));

    const scrollToStores = (type: OrderType) => {
        setOrderType(type);
        setTimeout(() => {
            storesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <HomeHeader />

            {/* 비로그인 CTA */}
            {!user && (
                <button
                    onClick={() => router.push('/login')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 text-white"
                >
                    <span className="text-sm">
                        <span className="font-bold text-brand-yellow">로그인</span> 후 다양한 혜택을 누려보세요
                    </span>
                    <ChevronRight size={16} className="text-gray-400" />
                </button>
            )}

            {/* 주문 유형 카드 */}
            <ServiceButtons
                onDelivery={() => scrollToStores('delivery')}
                onTakeout={() => scrollToStores('takeout')}
            />

            {/* 선물하기 배너 */}
            <div className="px-4 mb-1">
                <button className="w-full bg-brand-yellow text-brand-black p-4 rounded-xl font-bold flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                        <Gift size={22} />
                        <span className="text-base">타코몰리 선물하기</span>
                    </div>
                    <span className="text-sm font-medium opacity-70">소중한 마음을 전해요 &gt;</span>
                </button>
            </div>

            {/* 매장 목록 */}
            <div ref={storesSectionRef} className="px-4 pt-5 pb-2">
                {/* 탭 필터 */}
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={() => setOrderType('delivery')}
                        className={`text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${
                            orderType === 'delivery'
                                ? 'bg-brand-yellow text-brand-black'
                                : 'bg-white text-gray-400 border border-gray-200'
                        }`}
                    >
                        배달
                    </button>
                    <button
                        onClick={() => setOrderType('takeout')}
                        className={`text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${
                            orderType === 'takeout'
                                ? 'bg-brand-green text-white'
                                : 'bg-white text-gray-400 border border-gray-200'
                        }`}
                    >
                        방문포장
                    </button>
                </div>

                {/* 검색 */}
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="매장명, 지역으로 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white text-brand-black rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm"
                    />
                </div>

                {/* 즐겨찾기 */}
                {isLoggedIn && !searchQuery && favoriteStores.length > 0 && (
                    <>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                            즐겨찾기
                        </h2>
                        <div className="space-y-2 mb-5">
                            {favoriteStores.map((store) => (
                                <StoreCard
                                    key={store.id}
                                    store={store}
                                    isFavorite={true}
                                    onSelect={() => router.push(`/store/${store.id}/menu`)}
                                    onToggleFavorite={() => toggleFavorite(store.id)}
                                />
                            ))}
                        </div>
                    </>
                )}

                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                    {orderType === 'delivery' ? '배달 가능' : '방문포장 가능'} 매장
                    {!isLoading && ` (${filteredStores.length})`}
                </h2>

                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-24" />
                        ))}
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="text-center py-14 text-gray-400">
                        <Bike size={36} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">
                            {searchQuery ? '검색 결과가 없습니다' : '현재 이용 가능한 매장이 없습니다'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredStores.map((store) => (
                            <StoreCard
                                key={store.id}
                                store={store}
                                isFavorite={favoriteStoreIds.has(store.id)}
                                onSelect={() => router.push(`/store/${store.id}/menu`)}
                                onToggleFavorite={isLoggedIn ? () => toggleFavorite(store.id) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </main>
    );
}

function StoreCard({
    store,
    isFavorite,
    onSelect,
    onToggleFavorite,
}: {
    store: Store;
    isFavorite: boolean;
    onSelect: () => void;
    onToggleFavorite?: () => void;
}) {
    return (
        <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button onClick={onSelect} className="w-full text-left p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="font-bold text-base text-brand-black">{store.name}</h3>
                            {store.branchName && (
                                <span className="text-sm text-gray-400">{store.branchName}</span>
                            )}
                        </div>

                        {store.address && (
                            <p className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                                <MapPin size={11} className="flex-shrink-0" />
                                <span className="truncate">{store.address}</span>
                            </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            <span className="font-medium">
                                배달비{' '}
                                {store.deliveryFee
                                    ? `${store.deliveryFee.toLocaleString()}원`
                                    : '무료'}
                            </span>
                            {store.freeDeliveryThreshold && (
                                <span className="text-green-600">
                                    {store.freeDeliveryThreshold.toLocaleString()}원↑ 무료
                                </span>
                            )}
                            <span className="text-gray-300">·</span>
                            <span>최소 {(store.minimumOrderAmount || 0).toLocaleString()}원</span>
                            {store.estimatedDeliveryMinutes && (
                                <>
                                    <span className="text-gray-300">·</span>
                                    <span className="flex items-center gap-0.5">
                                        <Clock size={10} />
                                        약 {store.estimatedDeliveryMinutes}분
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <ChevronRight size={18} className="text-gray-300 flex-shrink-0 mt-1" />
                </div>
            </button>

            {onToggleFavorite && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                    }}
                    className="absolute top-3 right-9 p-1.5"
                    aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                >
                    <Heart
                        size={17}
                        className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'}
                    />
                </button>
            )}
        </div>
    );
}
