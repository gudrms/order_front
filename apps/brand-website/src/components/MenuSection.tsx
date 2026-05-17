import Link from 'next/link';
import ScrollAnimation from './ScrollAnimation';

interface BrandMenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isFeatured: boolean;
    isActive: boolean;
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

async function getFeaturedMenus(): Promise<BrandMenuItem[]> {
    try {
        const response = await fetch(`${API_URL}/brand-menus?featured=true`, {
            next: { revalidate: 300 },
        });
        if (!response.ok) return [];
        return unwrapList<BrandMenuItem>(await response.json()).slice(0, 4);
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
                            타코몰리<span className="text-brand-yellow"> 대표 메뉴</span>
                        </h3>
                        <p className="mt-4 text-gray-600">
                            브랜드 관리자가 등록한 대표 메뉴와 실제 메뉴 사진을 보여드립니다.
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
                                대표 메뉴를 준비 중입니다.
                            </p>
                            <p className="text-gray-600">
                                관리자에서 브랜드 대표 메뉴를 등록하면 홈페이지에 자동으로 표시됩니다.
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
