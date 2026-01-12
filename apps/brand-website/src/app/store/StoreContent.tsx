'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Search, Navigation } from 'lucide-react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { useGeolocation, STORES } from '@order/shared';
import ScrollAnimation from '@/components/ScrollAnimation';

export default function StoreContent() {
    const [selectedStore, setSelectedStore] = useState(STORES[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState({ lat: 37.566826, lng: 126.9786567 });
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [sortedStores, setSortedStores] = useState(STORES.map(store => ({ ...store, distance: 0 })));

    // Use Kakao Loader
    const [loading, error] = useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY!,
        libraries: ['services', 'clusterer'],
    });

    // Handle store selection and geocoding
    const handleStoreSelect = (store: typeof STORES[0]) => {
        setSelectedStore(store);

        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
            // Fallback to approximate coords if API not ready
            setMapCenter({ lat: store.lat, lng: store.lng });
            return;
        }

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(store.address, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const newCenter = {
                    lat: parseFloat(result[0].y),
                    lng: parseFloat(result[0].x),
                };
                setMapCenter(newCenter);
            } else {
                // Fallback
                setMapCenter({ lat: store.lat, lng: store.lng });
            }
        });
    };

    // Calculate distance between two coordinates in km (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    const { loaded, coordinates, error: geoError } = useGeolocation();

    // Update map center when user location is found via hook
    useEffect(() => {
        if (loaded && coordinates) {
            setUserLocation(coordinates);
            setMapCenter(coordinates);

            // Calculate distance and sort stores
            const storesWithDistance = STORES.map(store => {
                const distance = calculateDistance(coordinates.lat, coordinates.lng, store.lat, store.lng);
                return { ...store, distance };
            });

            storesWithDistance.sort((a, b) => a.distance - b.distance);
            setSortedStores(storesWithDistance);

            // Select the nearest store
            if (storesWithDistance.length > 0) {
                setSelectedStore(storesWithDistance[0]);
            }
        } else if (geoError) {
            alert(`위치 정보를 가져올 수 없습니다: ${geoError.message}`);
        }
    }, [loaded, coordinates, geoError]);

    const handleFindNearby = () => {
        if (loaded && coordinates) {
            setMapCenter(coordinates);
        } else if (!loaded) {
            alert('위치 정보를 가져오는 중입니다...');
        }
    };

    const filteredStores = sortedStores.filter(store =>
        store.name.includes(searchQuery) || store.address.includes(searchQuery)
    );

    if (loading) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-white">Loading Map...</div>;
    if (error) return <div className="min-h-screen bg-brand-black flex items-center justify-center text-red-500">Map Error: {error.message}</div>;

    return (
        <main className="flex flex-col-reverse md:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-80px)] bg-white">
            {/* Left: Store List */}
            <div className="w-full md:w-[400px] flex flex-col border-r border-gray-200 bg-white h-[55%] md:h-full shadow-xl z-10 relative">
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
                    <a
                        href={process.env.NEXT_PUBLIC_DELIVERY_URL || 'http://localhost:3001'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex md:hidden items-center justify-center gap-2 bg-brand-green text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-bold"
                    >
                        <Phone size={18} />
                        주문하기
                    </a>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {filteredStores.map((store, idx) => (
                        <ScrollAnimation key={store.id} delay={idx * 0.05}>
                            <div
                                onClick={() => handleStoreSelect(store)}
                                className={`p-5 rounded-xl border cursor-pointer transition-all group shadow-sm ${selectedStore.id === store.id
                                    ? 'bg-white border-brand-yellow ring-1 ring-brand-yellow shadow-md'
                                    : 'bg-white border-gray-200 hover:border-brand-yellow/50 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-bold text-lg transition-colors ${selectedStore.id === store.id ? 'text-brand-black' : 'text-gray-800 group-hover:text-brand-black'
                                        }`}>
                                        {store.name}
                                    </h3>
                                    {store.status === 'open' ? (
                                        <span className="text-xs bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-full font-medium">영업중</span>
                                    ) : (
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">준비중</span>
                                    )}
                                </div>

                                <div className="space-y-2 text-sm text-gray-500">
                                    <p className="flex items-center gap-2">
                                        <MapPin size={14} className="text-brand-yellow shrink-0" />
                                        {store.address}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Phone size={14} className="text-brand-yellow shrink-0" />
                                        {store.phone}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Clock size={14} className="text-brand-yellow shrink-0" />
                                        {store.hours}
                                    </p>
                                    {store.distance > 0 && (
                                        <p className="text-brand-green font-bold text-xs mt-2">
                                            내 위치에서 {store.distance.toFixed(1)}km
                                        </p>
                                    )}
                                </div>
                            </div>
                        </ScrollAnimation>
                    ))}
                </div>
            </div>

            {/* Right: Map Area */}
            <div className="w-full md:flex-1 bg-gray-800 relative h-[45%] md:h-full">
                <Map
                    center={mapCenter}
                    style={{ width: "100%", height: "100%" }}
                    level={3}
                    onCreate={() => setIsMapLoaded(true)}
                >
                    {isMapLoaded && (
                        <>
                            <MapMarker
                                position={mapCenter}
                                image={{
                                    src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                                    size: { width: 24, height: 35 },
                                }}
                            >
                                <div style={{ padding: "5px", color: "#000" }}>
                                    {selectedStore.name}
                                </div>
                            </MapMarker>
                            {userLocation && (
                                <MapMarker
                                    position={userLocation as { lat: number; lng: number }}
                                    image={{
                                        src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
                                        size: { width: 24, height: 35 },
                                    }}
                                >
                                    <div style={{ padding: "5px", color: "#000" }}>내 위치</div>
                                </MapMarker>
                            )}
                        </>
                    )}
                </Map>

                {/* API Key Warning Overlay */}
                {!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center z-50">
                        <MapPin size={64} className="mb-4 text-brand-yellow" />
                        <h2 className="text-2xl font-bold mb-2">Kakao Map API Key Required</h2>
                        <p className="text-gray-400 max-w-md">
                            지도를 표시하려면 <code>NEXT_PUBLIC_KAKAO_MAP_KEY</code> 환경 변수가 필요합니다.<br />
                            <code>.env.local</code> 파일에 키를 추가해주세요.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
