'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Search, Navigation, ShoppingBag } from 'lucide-react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import OrderCTAButton from '@/components/OrderCTAButton';
import ScrollAnimation from '@/components/ScrollAnimation';

interface StoreDisplay {
    id: string;
    name: string;
    branchName: string;
    address: string | null;
    phoneNumber: string | null;
    businessHours: Record<string, any> | null;
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

const DEFAULT_CENTER = { lat: 37.566826, lng: 126.9786567 };
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
                setCoordinates({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
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

function formatHours(businessHours: Record<string, any> | null): string {
    if (!businessHours) return '매장에 문의하세요';
    if (typeof businessHours === 'string') return businessHours;
    const val = businessHours['weekday'] ?? businessHours['default'] ?? businessHours['mon'] ?? Object.values(businessHours)[0];
    return typeof val === 'string' ? val : '11:00 - 22:00';
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function StoreContent() {
    const [stores, setStores] = useState<StoreDisplay[]>([]);
    const [selectedStore, setSelectedStore] = useState<StoreDisplay | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY!,
        libraries: ['services', 'clusterer'],
    });

    const { loaded: geoLoaded, coordinates, error: geoError } = useBrowserGeolocation();

    // 매장 목록 로드
    useEffect(() => {
        fetch(`${API_URL}/stores`)
            .then((r) => r.json())
            .then((data: StoreDisplay[]) => {
                const withDefaults = data.map((s) => ({ ...s, lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, distance: 0 }));
                setStores(withDefaults);
                if (withDefaults.length > 0) {
                    setSelectedStore(withDefaults[0]);
                    geocodeAndUpdate(withDefaults[0], withDefaults, setStores, setSelectedStore, setMapCenter);
                }
            })
            .catch(() => {
                // API 실패 시 빈 목록으로 fallback
            })
            .finally(() => setIsLoading(false));
    }, []);

    // GPS 위치 기반 정렬
    useEffect(() => {
        if (!geoLoaded || !coordinates || stores.length === 0) return;
        if (geoError) return;

        setUserLocation(coordinates);
        setMapCenter(coordinates);

        setStores((prev) => {
            const sorted = prev
                .map((s) => ({ ...s, distance: haversine(coordinates.lat, coordinates.lng, s.lat, s.lng) }))
                .sort((a, b) => a.distance - b.distance);
            setSelectedStore(sorted[0] ?? null);
            return sorted;
        });
    }, [geoLoaded, coordinates, geoError]);

    const handleStoreSelect = (store: StoreDisplay) => {
        setSelectedStore(store);
        if (!window.kakao?.maps?.services) {
            setMapCenter({ lat: store.lat, lng: store.lng });
            return;
        }
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(store.address ?? '', (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const c = { lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) };
                setMapCenter(c);
                setStores((prev) =>
                    prev.map((s) => (s.id === store.id ? { ...s, lat: c.lat, lng: c.lng } : s)),
                );
            } else {
                setMapCenter({ lat: store.lat, lng: store.lng });
            }
        });
    };

    const handleFindNearby = () => {
        if (geoLoaded && coordinates) setMapCenter(coordinates);
    };

    const filteredStores = stores.filter(
        (s) =>
            s.name.includes(searchQuery) ||
            s.branchName.includes(searchQuery) ||
            (s.address ?? '').includes(searchQuery),
    );

    if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-white">Loading Map...</div>;
    if (error) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-red-500">Map Error: {error.message}</div>;

    return (
        <main className="flex flex-col-reverse md:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-80px)] bg-white">
            {/* Left: Store List */}
            <div className="w-full md:w-[420px] flex flex-col border-r border-gray-200 bg-white h-[55%] md:h-full shadow-xl z-10 relative">
                <div className="p-4 md:p-6 bg-white z-10 border-b border-gray-200 shrink-0">
                    <h1 className="text-xl md:text-2xl font-bold text-brand-black mb-4">FIND A STORE</h1>
                    <div className="relative mb-3">
                        <input
                            type="text"
                            placeholder="지역 또는 매장명 검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-gray-900 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors placeholder-gray-400"
                        />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                    <button
                        onClick={handleFindNearby}
                        className="w-full flex items-center justify-center gap-2 bg-brand-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-bold mb-3"
                    >
                        <Navigation size={18} />
                        내 주변 매장 찾기
                    </button>
                    <OrderCTAButton
                        className="w-full flex md:hidden items-center justify-center gap-2 bg-brand-green text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-bold"
                    >
                        <ShoppingBag size={18} />
                        지금 주문하기
                    </OrderCTAButton>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {isLoading && (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
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
                    {filteredStores.map((store, idx) => (
                        <ScrollAnimation key={store.id} delay={idx * 0.05}>
                            <div
                                onClick={() => handleStoreSelect(store)}
                                className={`p-5 rounded-xl border cursor-pointer transition-all group shadow-sm ${
                                    selectedStore?.id === store.id
                                        ? 'bg-white border-brand-yellow ring-1 ring-brand-yellow shadow-md'
                                        : 'bg-white border-gray-200 hover:border-brand-yellow/50 hover:shadow-md'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-brand-black transition-colors">
                                        {store.name} {store.branchName}
                                    </h3>
                                    <div className="flex flex-col items-end gap-1">
                                        {store.isActive ? (
                                            <span className="text-xs bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-full font-medium">영업중</span>
                                        ) : (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">준비중</span>
                                        )}
                                        {store.isDeliveryEnabled && (
                                            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">배달 가능</span>
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

                                {/* 배달 정보 */}
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

                                {/* 주문 버튼 */}
                                {store.isDeliveryEnabled && store.isActive && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <OrderCTAButton
                                            className="mt-3 w-full flex items-center justify-center gap-2 bg-brand-green text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-bold text-sm"
                                        >
                                            <ShoppingBag size={15} />
                                            지금 주문하기
                                        </OrderCTAButton>
                                    </div>
                                )}
                            </div>
                        </ScrollAnimation>
                    ))}
                </div>
            </div>

            {/* Right: Map */}
            <div className="w-full md:flex-1 bg-gray-800 relative h-[45%] md:h-full">
                <Map
                    center={mapCenter}
                    style={{ width: '100%', height: '100%' }}
                    level={3}
                    onCreate={() => setIsMapLoaded(true)}
                >
                    {isMapLoaded && selectedStore && (
                        <>
                            <MapMarker
                                position={{ lat: selectedStore.lat, lng: selectedStore.lng }}
                                image={{
                                    src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                                    size: { width: 24, height: 35 },
                                }}
                            >
                                <div style={{ padding: '5px', color: '#000' }}>
                                    {selectedStore.name} {selectedStore.branchName}
                                </div>
                            </MapMarker>
                            {userLocation && (
                                <MapMarker
                                    position={userLocation}
                                    image={{
                                        src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
                                        size: { width: 24, height: 35 },
                                    }}
                                >
                                    <div style={{ padding: '5px', color: '#000' }}>내 위치</div>
                                </MapMarker>
                            )}
                        </>
                    )}
                </Map>

                {!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center z-50">
                        <MapPin size={64} className="mb-4 text-brand-yellow" />
                        <h2 className="text-2xl font-bold mb-2">Kakao Map API Key Required</h2>
                        <p className="text-gray-400 max-w-md">
                            지도를 표시하려면 <code>NEXT_PUBLIC_KAKAO_MAP_KEY</code> 환경 변수가 필요합니다.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}

// 선택 매장의 주소로 좌표 geocoding 후 상태 업데이트하는 헬퍼
function geocodeAndUpdate(
    store: StoreDisplay,
    allStores: StoreDisplay[],
    setStores: React.Dispatch<React.SetStateAction<StoreDisplay[]>>,
    setSelectedStore: React.Dispatch<React.SetStateAction<StoreDisplay | null>>,
    setMapCenter: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>,
) {
    if (typeof window === 'undefined' || !store.address) return;
    // Kakao SDK 로드 전이면 skip; SDK 로드 후 handleStoreSelect에서 다시 처리됨
    const tryGeocode = () => {
        if (!window.kakao?.maps?.services) return;
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(store.address!, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const c = { lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) };
                setMapCenter(c);
                setStores(allStores.map((s) => (s.id === store.id ? { ...s, lat: c.lat, lng: c.lng } : s)));
                setSelectedStore((prev) => prev?.id === store.id ? { ...prev, lat: c.lat, lng: c.lng } : prev);
            }
        });
    };
    // 약간 delay 후 시도 (SDK 초기화 대기)
    setTimeout(tryGeocode, 500);
}
