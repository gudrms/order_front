import Link from 'next/link';

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
                <span className="inline-block py-1 px-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/50 font-bold text-sm mb-6 animate-fade-in-up">
                    AUTHENTIC MEXICAN TASTE
                </span>

                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
                    맛있는 즐거움,<br />
                    <span className="text-brand-yellow">타코몰리</span>입니다.
                </h1>

                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                    신선한 재료와 정통 멕시칸 레시피의 만남.<br className="hidden md:block" />
                    지금 가장 힙한 타코를 경험해보세요.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="#menu"
                        className="w-full sm:w-auto px-8 py-4 bg-brand-yellow text-brand-black font-bold text-lg rounded-full hover:bg-white hover:text-brand-green transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,193,7,0.4)]"
                    >
                        메뉴 보기
                    </Link>
                    <Link
                        href="#store"
                        className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white hover:text-brand-black transition-all"
                    >
                        매장 찾기
                    </Link>
                </div>
            </div>
        </section>
    );
}
