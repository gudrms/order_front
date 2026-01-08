import Image from 'next/image';

const MENU_ITEMS = [
    {
        id: 1,
        name: "시그니처 타코",
        desc: "직화구이 고기와 신선한 살사의 조화",
        price: "4,500원",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=800&auto=format&fit=crop",
        tag: "BEST"
    },
    {
        id: 2,
        name: "비프 부리또",
        desc: "든든한 한 끼, 꽉 찬 속재료",
        price: "8,900원",
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800&auto=format&fit=crop",
        tag: "HIT"
    },
    {
        id: 3,
        name: "치즈 퀘사디아",
        desc: "4가지 치즈의 풍미가 가득",
        price: "7,500원",
        image: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?q=80&w=800&auto=format&fit=crop",
        tag: null
    },
    {
        id: 4,
        name: "나초 플래터",
        desc: "맥주와 찰떡궁합, 바삭한 즐거움",
        price: "12,000원",
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?q=80&w=800&auto=format&fit=crop",
        tag: "NEW"
    }
];

export default function MenuSection() {
    return (
        <section id="menu" className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-brand-green font-bold tracking-widest mb-2">OUR MENU</h2>
                    <h3 className="text-4xl font-black text-brand-black">
                        타코몰리 <span className="text-brand-yellow">대표 메뉴</span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {MENU_ITEMS.map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                />
                                {item.tag && (
                                    <div className="absolute top-4 left-4 bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full bg-[#E60012]">
                                        {item.tag}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>

                            <div className="text-center">
                                <h4 className="text-xl font-bold text-brand-black mb-1 group-hover:text-brand-green transition-colors">
                                    {item.name}
                                </h4>
                                <p className="text-gray-500 text-sm mb-2">{item.desc}</p>
                                <p className="text-brand-yellow font-bold text-lg">{item.price}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link 
                        href="/menu"
                        className="inline-flex items-center justify-center px-8 py-3 border-2 border-brand-black text-brand-black font-bold rounded-full hover:bg-brand-black hover:text-white transition-colors"
                    >
                        전체 메뉴 보기
                    </Link>
                </div>
            </div>
        </section>
    );
}
