'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Clock, ChevronRight, Bike } from 'lucide-react';
import { getAllStores } from '@order/shared/api';
import type { Store } from '@order/shared';
import { useCurrentStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';

export default function Home() {
    const router = useRouter();
    const { selectStore, store: selectedStore } = useCurrentStore();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: stores = [], isLoading } = useQuery({
        queryKey: ['delivery-stores'],
        queryFn: getAllStores,
        staleTime: 5 * 60 * 1000,
    });

    const deliveryStores = stores.filter((s) => s.isDeliveryEnabled && s.isActive);
    const filteredStores = searchQuery
        ? deliveryStores.filter(
            (s) =>
                s.name.includes(searchQuery) ||
                s.address?.includes(searchQuery) ||
                s.branchName?.includes(searchQuery)
        )
        : deliveryStores;

    const handleSelectStore = (store: Store) => {
        selectStore(store);
        router.push('/menu');
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* 헤더 */}
            <header className="bg-brand-black text-white px-4 pt-12 pb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-brand-yellow text-sm font-medium">타코몰리 배달</p>
                        <h1 className="text-2xl font-black">매장을 선택해주세요</h1>
                    </div>
                    <button
                        onClick={() => router.push(user ? '/mypage' : '/login')}
                        className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                        {user ? '마이페이지' : '로그인'}
                    </button>
                </div>

                {/* 검색 */}
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="매장명, 지역으로 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white text-brand-black rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                </div>
            </header>

            <div className="px-4 py-4">
                {/* 현재 선택된 매장 */}
                {selectedStore && (
                    <div className="mb-4 p-3 bg-brand-yellow/10 border border-brand-yellow rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bike size={18} className="text-brand-yellow" />
                            <span className="text-sm font-bold text-brand-black">
                                {selectedStore.name} 선택 중
                            </span>
                        </div>
                        <button
                            onClick={() => router.push('/menu')}
                            className="text-xs font-bold text-brand-yellow flex items-center gap-0.5"
                        >
                            메뉴 보기 <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                <h2 className="text-base font-bold text-gray-700 mb-3">
                    배달 가능 매장{!isLoading && ` (${filteredStores.length})`}
                </h2>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-28" />
                        ))}
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Bike size={40} className="mx-auto mb-3 opacity-30" />
                        <p>{searchQuery ? '검색 결과가 없습니다' : '현재 배달 가능한 매장이 없습니다'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredStores.map((store) => (
                            <StoreCard
                                key={store.id}
                                store={store}
                                isSelected={selectedStore?.id === store.id}
                                onSelect={() => handleSelectStore(store)}
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
    isSelected,
    onSelect,
}: {
    store: Store;
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={`w-full text-left bg-white rounded-xl p-4 shadow-sm border-2 transition-all ${
                isSelected ? 'border-brand-yellow shadow-brand-yellow/20' : 'border-transparent'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base text-brand-black truncate">{store.name}</h3>
                        {isSelected && (
                            <span className="flex-shrink-0 text-xs font-bold text-brand-yellow border border-brand-yellow rounded-full px-2 py-0.5">
                                선택
                            </span>
                        )}
                    </div>

                    {store.address && (
                        <p className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                            <MapPin size={13} className="flex-shrink-0" />
                            <span className="truncate">{store.address}</span>
                        </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                        <span className="font-medium">
                            배달비{' '}
                            {store.deliveryFee
                                ? `${store.deliveryFee.toLocaleString()}원`
                                : '무료'}
                        </span>
                        {store.freeDeliveryThreshold && (
                            <span className="text-green-600">
                                {store.freeDeliveryThreshold.toLocaleString()}원 이상 무료
                            </span>
                        )}
                        <span>·</span>
                        <span>최소 {(store.minimumOrderAmount || 0).toLocaleString()}원</span>
                        {store.estimatedDeliveryMinutes && (
                            <>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                    <Clock size={11} />
                                    약 {store.estimatedDeliveryMinutes}분
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <ChevronRight size={20} className="text-gray-300 flex-shrink-0 mt-1" />
            </div>
        </button>
    );
}
