import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BrandStoryPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            
            {/* Hero */}
            <section className="relative h-[60vh] flex items-center justify-center bg-brand-black overflow-hidden">
                <div className="absolute inset-0 opacity-50">
                    <img 
                        src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=2880&auto=format&fit=crop" 
                        className="w-full h-full object-cover"
                        alt="Mexican Food"
                    />
                </div>
                <div className="relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter">OUR STORY</h1>
                    <p className="text-brand-yellow text-xl font-bold">멕시코의 열정을 담은 맛의 향연</p>
                </div>
            </section>

            {/* Philosophy */}
            <section className="py-24">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-brand-green font-bold tracking-[0.2em] mb-4">BRAND PHILOSOPHY</h2>
                    <h3 className="text-4xl font-black text-brand-black mb-12">"진짜 멕시코를 만나다"</h3>
                    
                    <div className="space-y-8 text-lg text-gray-600 leading-relaxed">
                        <p>
                            타코몰리는 단순한 패스트푸드가 아닙니다. <br />
                            신선한 재료와 정통 조리 방식을 고집하며, <br />
                            매일 아침 직접 만드는 살사와 수제 토르티야는 우리의 자부심입니다.
                        </p>
                        <p>
                            우리는 맛있는 음식을 넘어, <br />
                            함께 나누는 즐거움과 멕시코 특유의 활기찬 에너지를 전달하고자 합니다. <br />
                            한국인의 입맛에 맞춘 최적화된 레시피와 현지의 풍미 사이에서 <br />
                            가장 완벽한 밸런스를 찾아냈습니다.
                        </p>
                    </div>
                </div>
            </section>

            {/* Visual Grid */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="rounded-4xl overflow-hidden shadow-2xl transform hover:-rotate-2 transition-transform duration-500">
                            <img src="https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=1200" alt="Fresh Ingredients" />
                        </div>
                        <div className="space-y-6">
                            <span className="text-brand-yellow font-black text-6xl opacity-20">01</span>
                            <h4 className="text-3xl font-black">신선한 재료의 고집</h4>
                            <p className="text-gray-600 leading-relaxed">
                                전국 각지에서 엄선된 신선한 채소와 최상급 육류만을 사용합니다. <br />
                                재료 본연의 맛을 살리는 것이 타코몰리의 첫 번째 원칙입니다.
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-24">
                        <div className="order-2 md:order-1 space-y-6 md:text-right">
                            <span className="text-brand-yellow font-black text-6xl opacity-20">02</span>
                            <h4 className="text-3xl font-black">정통 레시피의 계승</h4>
                            <p className="text-gray-600 leading-relaxed">
                                현지 셰프와의 협업을 통해 완성된 시그니처 시즈닝과 <br />
                                오랜 시간 끓여낸 소스는 타코몰리만의 깊은 맛을 완성합니다.
                            </p>
                        </div>
                        <div className="order-1 md:order-2 rounded-4xl overflow-hidden shadow-2xl transform hover:rotate-2 transition-transform duration-500">
                            <img src="https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=1200" alt="Authentic Recipe" />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
