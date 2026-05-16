import Link from 'next/link';
import OrderCTAButton from './OrderCTAButton';
import ScrollAnimation from './ScrollAnimation';

export default function Hero() {
    return (
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-brand-black">
            {/* Background Pattern/Image Placeholder */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent z-10" />
                {/* Replace with actual taco image later */}
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=2880&auto=format&fit=crop')] bg-cover bg-center" />
            </div>

            <div className="container mx-auto px-4 relative z-20 text-center">
                <ScrollAnimation>
                    <span className="inline-block py-1 px-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/50 font-bold text-sm mb-6">
                        INCHEON-BASED CASUAL MEXICAN
                    </span>

                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
                        맛있는 즐거움,<br />
                        <span className="text-brand-yellow">타코몰리</span>입니다.
                    </h1>

                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        인천에서 시작해 7개 매장으로 확장한 캐주얼 멕시칸 브랜드.<br className="hidden md:block" />
                        가까운 매장에서 타코몰리를 바로 만나보세요.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10">
                        {[
                            ['인천 중심', '운영 지역'],
                            ['7개 매장', '운영 중'],
                            ['매장별', '바로 주문'],
                            ['가맹 상담', '접수 가능'],
                        ].map(([title, desc]) => (
                            <div
                                key={title}
                                className="border border-white/15 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3"
                            >
                                <div className="text-brand-yellow font-black text-lg">{title}</div>
                                <div className="text-gray-300 text-xs font-bold mt-1">{desc}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/menu"
                            className="w-full sm:w-auto px-8 py-4 bg-brand-yellow text-brand-black font-bold text-lg rounded-full hover:bg-white hover:text-brand-green transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,193,7,0.4)]"
                        >
                            메뉴 보기
                        </Link>
                        <OrderCTAButton
                            className="w-full sm:w-auto px-8 py-4 bg-brand-green text-white font-bold text-lg rounded-full hover:bg-green-700 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(0,128,0,0.3)]"
                        >
                            지금 주문하기
                        </OrderCTAButton>
                        <Link
                            href="/store"
                            className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white hover:text-brand-black transition-all"
                        >
                            매장 찾기
                        </Link>
                    </div>
                </ScrollAnimation>
            </div>
        </section>
    );
}
