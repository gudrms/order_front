'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Search, Navigation, ShoppingBag, ExternalLink } from 'lucide-react';
import ScrollAnimation from '@/components/ScrollAnimation';

interface StoreDisplay {
    id: string;
    name: string;
    branchName: string;
    address: string | null;
    phoneNumber: string | null;
    businessHours: Record<string, unknown> | null;
    isActive: boolean;
    isDeliveryEnabled: boolean;
    minimumOrderAmount: number;
    deliveryFee: number;
    freeDeliveryThreshold: number | null;
    estimatedDeliveryMinutes: number | null;
    lat: number;
    lng: number;
    distance: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tacomole.kr/api/v1';
const DELIVERY_URL = process.env.NEXT_PUBLIC_DELIVERY_URL || 'https://delivery.tacomole.kr';

function useBrowserGeolocation() {
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<GeolocationPositionError | Error | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError(new Error('Geolocation is not supported'));
            setLoaded(true);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
                setLoaded(true);
            },
            (geoError) => {
                setError(geoError);
                setLoaded(true);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
        );
    }, []);

    return { loaded, coordinates, error };
}

function formatHours(businessHours: Record<string, unknown> | null): string {
    if (!businessHours) return '매장에 문의하세요';
    if (typeof businessHours === 'string') return businessHours;
    const val =
        businessHours['weekday'] ??
        businessHours['default'] ??
        businessHours['mon'] ??
        Object.values(businessHours)[0];
    return typeof val === 'string' ? val : '11:00 - 22:00';
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function StoreContent() {
    const [stores, setStores] = useState<StoreDisplay[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    const { loaded: geoLoaded, coordinates, error: geoError } = useBrowserGeolocation();

    useEffect(() => {
        fetch(`${API_URL}/stores`)
            .then((r) => r.json())
            .then((json) => {
                const list: StoreDisplay[] = Array.isArray(json)
                    ? json
                    : (json.data ?? []);
                setStores(list.map((s) => ({ ...s, lat: 0, lng: 0, distance: 0 })));
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!geoLoaded || !coordinates || stores.length === 0 || geoError) return;
        setUserLocation(coordinates);
        setStores((prev) =>
            [...prev]
                .map((s) => ({
                    ...s,
                    distance: haversine(coordinates.lat, coordinates.lng, s.lat, s.lng),
                }))
                .sort((a, b) => a.distance - b.distance),
        );
    }, [geoLoaded, coordinates, geoError, stores.length]);

    const handleFindNearby = () => {
        if (userLocation) {
            setStores((prev) =>
                [...prev]
                    .map((s) => ({
                        ...s,
                        distance: haversine(userLocation.lat, userLocation.lng, s.lat, s.lng),
                    }))
                    .sort((a, b) => a.distance - b.distance),
            );
        }
    };

    const filteredStores = stores.filter(
        (s) =>
            s.name.includes(searchQuery) ||
            s.branchName.includes(searchQuery) ||
            (s.address ?? '').includes(searchQuery),
    );

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-10">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-black mb-6">FIND A STORE</h1>

                <div className="relative mb-3">
                    <input
                        type="text"
                        placeholder="지역 또는 매장명 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors placeholder-gray-400 shadow-sm"
                    />
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                </div>

                <button
                    onClick={handleFindNearby}
                    className="w-full flex items-center justify-center gap-2 bg-brand-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-bold mb-6 shadow-sm"
                >
                    <Navigation size={18} />
                    내 주변 매장 찾기
                </button>

                {isLoading && (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse shadow-sm"
                            >
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && filteredStores.length === 0 && (
                    <p className="text-center text-gray-400 py-10">검색 결과가 없습니다.</p>
                )}

                <div className="space-y-4">
                    {filteredStores.map((store, idx) => (
                        <ScrollAnimation key={store.id} delay={idx * 0.05}>
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-brand-yellow/50 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg text-gray-800">
                                        {store.name} {store.branchName}
                                    </h3>
                                    <div className="flex flex-col items-end gap-1">
                                        {store.isActive ? (
                                            <span className="text-xs bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-full font-medium">
                                                영업중
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                                                준비중
                                            </span>
                                        )}
                                        {store.isDeliveryEnabled && (
                                            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                                                배달 가능
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-sm text-gray-500">
                                    {store.address && (
                                        <p className="flex items-center gap-2">
                                            <MapPin size={14} className="text-brand-yellow shrink-0" />
                                            {store.address}
                                        </p>
                                    )}
                                    {store.phoneNumber && (
                                        <p className="flex items-center gap-2">
                                            <Phone size={14} className="text-brand-yellow shrink-0" />
                                            {store.phoneNumber}
                                        </p>
                                    )}
                                    <p className="flex items-center gap-2">
                                        <Clock size={14} className="text-brand-yellow shrink-0" />
                                        {formatHours(store.businessHours)}
                                    </p>
                                </div>

                                {store.isDeliveryEnabled && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs text-gray-500">
                                        <span>최소 {store.minimumOrderAmount.toLocaleString()}원</span>
                                        <span>
                                            배달비{' '}
                                            {store.freeDeliveryThreshold
                                                ? `${store.deliveryFee.toLocaleString()}원 (${store.freeDeliveryThreshold.toLocaleString()}원 이상 무료)`
                                                : `${store.deliveryFee.toLocaleString()}원`}
                                        </span>
                                        {store.estimatedDeliveryMinutes && (
                                            <span>예상 {store.estimatedDeliveryMinutes}분</span>
                                        )}
                                    </div>
                                )}

                                {store.distance > 0 && (
                                    <p className="text-brand-green font-bold text-xs mt-2">
                                        내 위치에서 {store.distance.toFixed(1)}km
                                    </p>
                                )}

                                {store.isDeliveryEnabled && store.isActive && (
                                    <a
                                        href={`${DELIVERY_URL}/store/${store.id}/menu`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-green text-white py-2.5 rounded-xl hover:bg-green-700 transition-colors font-bold text-sm"
                                    >
                                        <ShoppingBag size={15} />
                                        지금 주문하기
                                        <ExternalLink size={13} className="opacity-60" />
                                    </a>
                                )}
                            </div>
                        </ScrollAnimation>
                    ))}
                </div>
            </div>
        </main>
    );
}
