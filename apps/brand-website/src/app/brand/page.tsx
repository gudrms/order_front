import { Metadata } from 'next';
import Image from 'next/image';
import ScrollAnimation from '@/components/ScrollAnimation';

export const metadata: Metadata = {
    title: '브랜드 스토리 | 타코몰리',
    description: '타코몰리의 시작과 철학, 그리고 신선한 재료에 대한 이야기를 전해드립니다.',
};

export default function BrandPage() {
    return (
        <main className="min-h-screen bg-white text-brand-black">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 z-10" />
                {/* Placeholder for Brand Hero Image */}
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-300">
                    <span className="text-9xl opacity-20">🌮</span>
                </div>

                <div className="relative z-20 text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-bold text-brand-black mb-6 tracking-tighter">
                        OUR STORY
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-light">
                        "멕시코의 태양을 담은 맛, 타코몰리"
                    </p>
                </div>
            </section>

            {/* Philosophy Section */}
            <section className="py-20 container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <ScrollAnimation className="space-y-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-brand-black">
                            <span className="text-brand-green">Fresh</span> Ingredients,<br />
                            <span className="text-brand-yellow">Authentic</span> Taste
                        </h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            타코몰리는 2024년, 작은 푸드트럭에서 시작되었습니다.
                            우리는 단순히 음식을 파는 것이 아니라, 멕시코의 활기찬 문화와
                            즐거움을 전달하고 싶었습니다.
                        </p>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            매일 아침 공수하는 신선한 야채, 직접 삶은 콩,
                            그리고 비법 향신료로 숙성시킨 고기까지.
                            타협하지 않는 정성이 타코몰리의 자부심입니다.
                        </p>
                    </ScrollAnimation>
                    <ScrollAnimation delay={0.2} className="relative h-[400px] bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 transform rotate-2 hover:rotate-0 transition-transform duration-500 shadow-xl">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                            <span className="text-8xl opacity-20">🥑</span>
                        </div>
                    </ScrollAnimation>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 bg-brand-yellow/10">
                <div className="container mx-auto px-4">
                    <ScrollAnimation>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-brand-green mb-4">CORE VALUES</h2>
                            <p className="text-gray-600">우리가 지키고자 하는 세 가지 약속</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: 'Freshness', icon: '🌿', desc: '당일 손질한 신선한 재료만을 사용합니다.' },
                                { title: 'Passion', icon: '🔥', desc: '멕시칸 푸드에 대한 열정을 요리에 담습니다.' },
                                { title: 'Joy', icon: '🎉', desc: '맛있는 음식으로 고객에게 즐거움을 드립니다.' },
                            ].map((value, idx) => (
                                <ScrollAnimation key={idx} delay={idx * 0.1} className="bg-white p-8 rounded-2xl text-center border border-gray-100 hover:border-brand-yellow transition-colors shadow-sm hover:shadow-md">
                                    <div className="text-5xl mb-6">{value.icon}</div>
                                    <h3 className="text-xl font-bold text-brand-black mb-4">{value.title}</h3>
                                    <p className="text-gray-500">{value.desc}</p>
                                </ScrollAnimation>
                            ))}
                        </div>
                    </ScrollAnimation>
                </div>
            </section>
        </main>
    );
}
