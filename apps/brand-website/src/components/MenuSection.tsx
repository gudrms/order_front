import Link from 'next/link';
import ScrollAnimation from './ScrollAnimation';

interface StoreSummary {
    id: string;
    isActive: boolean;
}

interface Category {
    id: string;
    name: string;
    sortOrder: number;
}

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isAvailable: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tacomole.kr/api/v1';

function unwrapList<T>(json: unknown): T[] {
    if (Array.isArray(json)) return json as T[];
    if (json && typeof json === 'object' && 'data' in json) {
        const data = (json as { data?: unknown }).data;
        return Array.isArray(data) ? (data as T[]) : [];
    }
    return [];
}

async function fetchJson<T>(url: string): Promise<T[]> {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    return unwrapList<T>(await response.json());
}

async function getFeaturedMenus(): Promise<MenuItem[]> {
    try {
        const stores = await fetchJson<StoreSummary>(`${API_URL}/stores`);
        const store = stores.find((item) => item.isActive) ?? stores[0];
        if (!store) return [];

        const categories = await fetchJson<Category>(`${API_URL}/stores/${store.id}/categories`);
        const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 4);
        const menuGroups = await Promise.all(
            sortedCategories.map((category) =>
                fetchJson<MenuItem>(`${API_URL}/stores/${store.id}/menus?categoryId=${category.id}`),
            ),
        );

        return menuGroups
            .flat()
            .filter((item) => item.isAvailable)
            .slice(0, 4);
    } catch {
        return [];
    }
}

export default async function MenuSection() {
    const menuItems = await getFeaturedMenus();

    return (
        <section id="menu" className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <ScrollAnimation>
                    <div className="text-center mb-16">
                        <h2 className="text-brand-green font-bold tracking-widest mb-2">OUR MENU</h2>
                        <h3 className="text-4xl font-black text-brand-black">
                            타코몰리 <span className="text-brand-yellow">대표 메뉴</span>
                        </h3>
                        <p className="mt-4 text-gray-600">
                            관리자에 등록된 메뉴와 사진을 기준으로 보여드립니다.
                        </p>
                    </div>

                    {menuItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {menuItems.map((item, idx) => (
                                <ScrollAnimation key={item.id} delay={idx * 0.1}>
                                    <div className="group h-full">
                                        <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
                                            {item.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-brand-green font-black">
                                                    TACO MOLE
                                                </div>
                                            )}
                                            {idx === 0 && (
                                                <div className="absolute top-4 left-4 bg-[#E60012] text-white text-xs font-bold px-3 py-1 rounded-full">
                                                    BEST
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>

                                        <div className="text-center">
                                            <h4 className="text-xl font-bold text-brand-black mb-1 group-hover:text-brand-green transition-colors">
                                                {item.name}
                                            </h4>
                                            {item.description && (
                                                <p className="text-gray-500 text-sm mb-2 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}
                                            <p className="text-brand-black font-black">
                                                {item.price.toLocaleString()}원
                                            </p>
                                        </div>
                                    </div>
                                </ScrollAnimation>
                            ))}
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                            <p className="text-lg font-bold text-brand-black mb-2">
                                대표 메뉴를 불러오는 중입니다.
                            </p>
                            <p className="text-gray-600">
                                전체 메뉴 페이지에서 현재 판매 중인 메뉴를 확인할 수 있습니다.
                            </p>
                        </div>
                    )}

                    <div className="text-center mt-12">
                        <Link
                            href="/menu"
                            className="inline-flex items-center justify-center px-8 py-3 border-2 border-brand-black text-brand-black font-bold rounded-full hover:bg-brand-black hover:text-white transition-colors"
                        >
                            전체 메뉴 보기
                        </Link>
                    </div>
                </ScrollAnimation>
            </div>
        </section>
    );
}
