import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MENU_CATEGORIES = [
    { id: 'taco', name: '타코' },
    { id: 'burrito', name: '부리또' },
    { id: 'quesadilla', name: '퀘사디아' },
    { id: 'side', name: '사이드 & 음료' },
];

const ALL_MENU = [
    {
        id: 1,
        category: 'taco',
        name: "시그니처 타코",
        desc: "직화구이 고기와 신선한 살사의 조화",
        price: "4,500원",
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=800&auto=format&fit=crop",
        tag: "BEST"
    },
    {
        id: 2,
        category: 'burrito',
        name: "비프 부리또",
        desc: "든든한 한 끼, 꽉 찬 속재료",
        price: "8,900원",
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800&auto=format&fit=crop",
        tag: "HIT"
    },
    {
        id: 3,
        category: 'quesadilla',
        name: "치즈 퀘사디아",
        desc: "4가지 치즈의 풍미가 가득",
        price: "7,500원",
        image: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?q=80&w=800&auto=format&fit=crop",
        tag: null
    },
    {
        id: 4,
        category: 'side',
        name: "나초 플래터",
        desc: "맥주와 찰떡궁합, 바삭한 즐거움",
        price: "12,000원",
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?q=80&w=800&auto=format&fit=crop",
        tag: "NEW"
    }
];

export default function MenuPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            
            {/* Page Header */}
            <section className="py-20 bg-brand-black text-center">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">MENU</h1>
                <p className="text-brand-yellow font-bold">타코몰리의 정성 가득한 메뉴를 소개합니다.</p>
            </section>

            {/* Category Tabs */}
            <section className="sticky top-20 z-40 bg-white border-b border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center gap-4 md:gap-12 py-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {MENU_CATEGORIES.map((cat) => (
                            <button 
                                key={cat.id}
                                className="text-lg font-bold text-gray-400 hover:text-brand-green transition-colors pb-2 border-b-2 border-transparent hover:border-brand-green"
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Menu Grid */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {ALL_MENU.map((item) => (
                            <div key={item.id} className="group">
                                <div className="relative aspect-square rounded-3xl overflow-hidden mb-6 bg-gray-100 shadow-md">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {item.tag && (
                                        <div className="absolute top-5 left-5 bg-[#E60012] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                                            {item.tag}
                                        </div>
                                    )}
                                </div>
                                <div className="px-2">
                                    <h2 className="text-2xl font-black text-brand-black mb-2 group-hover:text-brand-green transition-colors">
                                        {item.name}
                                    </h2>
                                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">{item.desc}</p>
                                    <p className="text-brand-yellow font-black text-xl">{item.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
