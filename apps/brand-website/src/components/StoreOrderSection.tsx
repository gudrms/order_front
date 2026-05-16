import Link from 'next/link';
import { Clock, ExternalLink, MapPin, Navigation, ShoppingBag } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';

interface HomeStore {
    id: string;
    name: string;
    branchName: string;
    address: string | null;
    isActive: boolean;
    isDeliveryEnabled: boolean;
    estimatedDeliveryMinutes: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tacomole.kr/api/v1';
const DELIVERY_URL = process.env.NEXT_PUBLIC_DELIVERY_URL || 'https://delivery.tacomole.kr';

async function getHomeStores(): Promise<HomeStore[]> {
    try {
        const response = await fetch(`${API_URL}/stores`, {
            next: { revalidate: 300 },
        });

        if (!response.ok) return [];

        const json = await response.json();
        const stores: HomeStore[] = Array.isArray(json) ? json : (json.data ?? []);

        return stores
            .filter((store) => store.isActive)
            .sort((a, b) => Number(b.isDeliveryEnabled) - Number(a.isDeliveryEnabled))
            .slice(0, 3);
    } catch {
        return [];
    }
}

function getStoreRegion(store: HomeStore): string {
    if (!store.address) return '가까운 타코몰리 매장';
    const parts = store.address.split(' ').filter(Boolean);
    return parts.slice(0, 2).join(' ') || store.address;
}

export default async function StoreOrderSection() {
    const stores = await getHomeStores();

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                <ScrollAnimation>
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
                        <div>
                            <p className="text-brand-green font-bold tracking-widest mb-2">STORE & ORDER</p>
                            <h2 className="text-3xl md:text-4xl font-black text-brand-black leading-tight">
                                가까운 타코몰리 매장을<br className="hidden sm:block" />
                                찾아보세요.
                            </h2>
                            <p className="text-gray-600 mt-4 max-w-2xl leading-relaxed">
                                인천 중심으로 운영 중인 타코몰리 매장을 확인하고,
                                매장별 주문 페이지에서 바로 주문할 수 있습니다.
                            </p>
                        </div>

                        <Link
                            href="/store"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-black text-white font-bold rounded-full hover:bg-brand-green transition-colors"
                        >
                            <Navigation size={18} />
                            전체 매장 보기
                        </Link>
                    </div>
                </ScrollAnimation>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stores.length > 0 ? (
                        stores.map((store, index) => (
                            <ScrollAnimation key={store.id} delay={index * 0.08}>
                                <article className="h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4 mb-5">
                                        <div>
                                            <p className="text-sm font-bold text-brand-green mb-1">
                                                {getStoreRegion(store)}
                                            </p>
                                            <h3 className="text-xl font-black text-brand-black">
                                                {store.name} {store.branchName}
                                            </h3>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-brand-yellow/20 text-brand-black px-3 py-1 text-xs font-bold">
                                            영업중
                                        </span>
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-600 mb-6">
                                        {store.address && (
                                            <p className="flex gap-2">
                                                <MapPin size={16} className="text-brand-yellow shrink-0 mt-0.5" />
                                                <span>{store.address}</span>
                                            </p>
                                        )}
                                        <p className="flex gap-2">
                                            <Clock size={16} className="text-brand-yellow shrink-0 mt-0.5" />
                                            <span>
                                                {store.estimatedDeliveryMinutes
                                                    ? `예상 배달 ${store.estimatedDeliveryMinutes}분`
                                                    : '매장별 운영 시간 확인'}
                                            </span>
                                        </p>
                                    </div>

                                    {store.isDeliveryEnabled ? (
                                        <a
                                            href={`${DELIVERY_URL}/store/${store.id}/menu`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full bg-brand-green text-white py-3 rounded-xl font-bold hover:bg-brand-black transition-colors"
                                        >
                                            <ShoppingBag size={17} />
                                            지금 주문하기
                                            <ExternalLink size={14} className="opacity-70" />
                                        </a>
                                    ) : (
                                        <Link
                                            href="/store"
                                            className="flex items-center justify-center w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                        >
                                            매장 정보 보기
                                        </Link>
                                    )}
                                </article>
                            </ScrollAnimation>
                        ))
                    ) : (
                        <ScrollAnimation className="md:col-span-3">
                            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                                <p className="text-lg font-bold text-brand-black mb-2">
                                    매장 정보를 불러오는 중입니다.
                                </p>
                                <p className="text-gray-600 mb-6">
                                    전체 매장 페이지에서 현재 운영 매장과 주문 링크를 확인할 수 있습니다.
                                </p>
                                <Link
                                    href="/store"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-green text-white font-bold rounded-full hover:bg-brand-black transition-colors"
                                >
                                    <MapPin size={18} />
                                    매장 찾기
                                </Link>
                            </div>
                        </ScrollAnimation>
                    )}
                </div>
            </div>
        </section>
    );
}
