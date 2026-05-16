'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
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
    lat: number | null;
    lng: number | null;
    distance: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tacomole.kr/api/v1';
const DELIVERY_URL = process.env.NEXT_PUBLIC_DELIVERY_URL || 'https://delivery.tacomole.kr';
const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || '';

// 서울 중심 기본 좌표
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

function hasCoordinates(store: StoreDisplay): store is StoreDisplay & { lat: number; lng: number } {
    return typeof store.lat === 'number' && typeof store.lng === 'number' && store.lat !== 0 && store.lng !== 0;
}

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

function StoreCard({
    store,
    isSelected,
    onClick,
}: {
    store: StoreDisplay;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-5 rounded-2xl border shadow-sm transition-all cursor-pointer ${
                isSelected
                    ? 'border-brand-yellow shadow-md ring-2 ring-brand-yellow/30'
                    : 'border-gray-200 hover:border-brand-yellow/50 hover:shadow-md'
            }`}
        >
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
                    {!hasCoordinates(store) && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                            좌표 확인 필요
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

            {Number.isFinite(store.distance) && store.distance > 0 && (
                <p className="text-brand-green font-bold text-xs mt-2">
                    내 위치에서 {store.distance.toFixed(1)}km
                </p>
            )}

            {store.isDeliveryEnabled && store.isActive && (
                <a
                    href={`${DELIVERY_URL}/store/${store.id}/menu`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-green text-white py-2.5 rounded-xl hover:bg-green-700 transition-colors font-bold text-sm"
                >
                    <ShoppingBag size={15} />
                    지금 주문하기
                    <ExternalLink size={13} className="opacity-60" />
                </a>
            )}
        </div>
    );
}

function KakaoMapView({
    stores,
    selectedId,
    mapCenter,
    fitBoundsKey,
    onMarkerClick,
}: {
    stores: StoreDisplay[];
    selectedId: string | null;
    mapCenter: { lat: number; lng: number };
    fitBoundsKey: string;
    onMarkerClick: (store: StoreDisplay) => void;
}) {
    const [loading, loadError] = useKakaoLoader({
        appkey: KAKAO_MAP_KEY,
        libraries: ['services'],
    });
    const mapRef = useRef<kakao.maps.Map | null>(null);
    const validStores = useMemo(() => stores.filter(hasCoordinates), [stores]);

    useEffect(() => {
        if (!mapRef.current || validStores.length === 0 || typeof kakao === 'undefined') return;

        if (validStores.length === 1) {
            const store = validStores[0];
            mapRef.current.setCenter(new kakao.maps.LatLng(store.lat, store.lng));
            mapRef.current.setLevel(4);
            return;
        }

        const bounds = new kakao.maps.LatLngBounds();
        validStores.forEach((store) => {
            bounds.extend(new kakao.maps.LatLng(store.lat, store.lng));
        });
        mapRef.current.setBounds(bounds);
    }, [fitBoundsKey, validStores.length]);

    useEffect(() => {
        if (!mapRef.current || typeof kakao === 'undefined') return;
        mapRef.current.setCenter(new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng));
    }, [mapCenter.lat, mapCenter.lng]);

    if (loadError || loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl text-gray-400 text-sm">
                {loadError ? '지도를 불러올 수 없습니다' : '지도 로딩 중...'}
            </div>
        );
    }

    if (validStores.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl text-gray-400 text-sm text-center px-6">
                지도에 표시할 좌표가 등록된 매장이 없습니다.
            </div>
        );
    }

    return (
        <Map
            center={mapCenter}
            style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
            level={7}
            onCreate={(map) => {
                mapRef.current = map;
            }}
        >
            {validStores.map((store) => (
                <MapMarker
                    key={store.id}
                    position={{ lat: store.lat, lng: store.lng }}
                    onClick={() => onMarkerClick(store)}
                    image={
                        store.id === selectedId
                            ? {
                                  src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                                  size: { width: 24, height: 35 },
                              }
                            : undefined
                    }
                    title={`${store.name} ${store.branchName}`}
                />
            ))}
        </Map>
    );
}

export default function StoreContent() {
    const [stores, setStores] = useState<StoreDisplay[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [fitBoundsKey, setFitBoundsKey] = useState('initial');
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const { loaded: geoLoaded, coordinates, error: geoError } = useBrowserGeolocation();
    const hasMapKey = Boolean(KAKAO_MAP_KEY);

    useEffect(() => {
        fetch(`${API_URL}/stores`)
            .then((r) => r.json())
            .then((json) => {
                const list: StoreDisplay[] = Array.isArray(json) ? json : (json.data ?? []);
                setStores(list.map((s) => ({ ...s, distance: 0 })));
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!geoLoaded || !coordinates || stores.length === 0 || geoError) return;
        setUserLocation(coordinates);
        setMapCenter(coordinates);
        setStores((prev) =>
            [...prev]
                .map((s) => ({
                    ...s,
                    distance: hasCoordinates(s)
                        ? haversine(coordinates.lat, coordinates.lng, s.lat, s.lng)
                        : Number.POSITIVE_INFINITY,
                }))
                .sort((a, b) => a.distance - b.distance),
        );
    }, [geoLoaded, coordinates, geoError, stores.length]);

    const handleFindNearby = () => {
        if (!userLocation) return;
        setMapCenter(userLocation);
        setStores((prev) =>
            [...prev]
                .map((s) => ({
                    ...s,
                    distance: hasCoordinates(s)
                        ? haversine(userLocation.lat, userLocation.lng, s.lat, s.lng)
                        : Number.POSITIVE_INFINITY,
                }))
                .sort((a, b) => a.distance - b.distance),
        );
    };

    const handleResetMapBounds = () => {
        setFitBoundsKey(`all-${Date.now()}`);
    };

    const handleMarkerClick = (store: StoreDisplay) => {
        setSelectedId(store.id);
        if (hasCoordinates(store)) {
            setMapCenter({ lat: store.lat, lng: store.lng });
        }
        const el = cardRefs.current[store.id];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const handleCardClick = (store: StoreDisplay) => {
        setSelectedId(store.id);
        if (hasCoordinates(store)) {
            setMapCenter({ lat: store.lat, lng: store.lng });
        }
    };

    const filteredStores = useMemo(
        () =>
            stores.filter(
                (s) =>
                    s.name.includes(searchQuery) ||
                    s.branchName.includes(searchQuery) ||
                    (s.address ?? '').includes(searchQuery),
            ),
        [stores, searchQuery],
    );
    const filteredStoreKey = useMemo(
        () => filteredStores.map((store) => store.id).join(','),
        [filteredStores],
    );
    const mappedStoreCount = filteredStores.filter(hasCoordinates).length;

    useEffect(() => {
        setSelectedId(null);
        setFitBoundsKey(`filter-${searchQuery}-${filteredStoreKey}`);
    }, [searchQuery, filteredStoreKey]);

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-black mb-6">
                    FIND A STORE
                </h1>

                {/* 검색 + 내 주변 */}
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <div className="relative flex-1">
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
                        className="flex items-center gap-2 bg-brand-black text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition-colors font-bold shadow-sm whitespace-nowrap"
                    >
                        <Navigation size={18} />
                        내 주변
                    </button>
                    {hasMapKey && (
                        <button
                            onClick={handleResetMapBounds}
                            className="flex items-center justify-center gap-2 bg-white text-brand-black border border-gray-200 px-4 py-3 rounded-xl hover:border-brand-yellow transition-colors font-bold shadow-sm whitespace-nowrap"
                        >
                            전체 보기
                        </button>
                    )}
                </div>

                {!isLoading && (
                    <p className="text-sm text-gray-500 mb-4">
                        총 <span className="font-bold text-brand-green">{filteredStores.length}</span>개 매장이 표시됩니다.
                        {hasMapKey && (
                            <span className="ml-2">
                                지도 표시 가능 매장 <span className="font-bold text-brand-green">{mappedStoreCount}</span>개
                            </span>
                        )}
                    </p>
                )}

                {hasMapKey ? (
                    /* 지도 + 목록 분할 레이아웃 */
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* 지도 */}
                        <div className="lg:sticky lg:top-4 lg:self-start w-full lg:w-1/2 h-[400px] lg:h-[600px] rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                            <KakaoMapView
                                stores={filteredStores}
                                selectedId={selectedId}
                                mapCenter={mapCenter}
                                fitBoundsKey={fitBoundsKey}
                                onMarkerClick={handleMarkerClick}
                            />
                        </div>

                        {/* 목록 */}
                        <div className="w-full lg:w-1/2 space-y-4 lg:max-h-[600px] lg:overflow-y-auto lg:pr-1">
                            {isLoading &&
                                [...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse shadow-sm"
                                    >
                                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                                        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                                    </div>
                                ))}
                            {!isLoading && filteredStores.length === 0 && (
                                <p className="text-center text-gray-400 py-10">
                                    검색 결과가 없습니다.
                                </p>
                            )}
                            {filteredStores.map((store, idx) => (
                                <ScrollAnimation key={store.id} delay={idx * 0.05}>
                                    <div ref={(el) => { cardRefs.current[store.id] = el; }}>
                                        <StoreCard
                                            store={store}
                                            isSelected={selectedId === store.id}
                                            onClick={() => handleCardClick(store)}
                                        />
                                    </div>
                                </ScrollAnimation>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* API 키 없을 때: 목록만 (로컬 개발) */
                    <div className="max-w-2xl space-y-4">
                        {isLoading &&
                            [...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse shadow-sm"
                                >
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                                    <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                                </div>
                            ))}
                        {!isLoading && filteredStores.length === 0 && (
                            <p className="text-center text-gray-400 py-10">
                                검색 결과가 없습니다.
                            </p>
                        )}
                        {filteredStores.map((store, idx) => (
                            <ScrollAnimation key={store.id} delay={idx * 0.05}>
                                <StoreCard
                                    store={store}
                                    isSelected={false}
                                    onClick={() => {}}
                                />
                            </ScrollAnimation>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
