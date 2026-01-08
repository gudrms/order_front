'use client';

import { useRouter } from 'next/navigation';

export default function FailPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h1 className="text-2xl font-bold mb-2">결제 실패</h1>
                <p className="text-gray-600 mb-6">
                    결제 처리 중 문제가 발생했습니다.
                    <br />
                    다시 시도해주세요.
                </p>

                <div className="space-y-2">
                    <button
                        onClick={() => router.push('/menu')}
                        className="w-full bg-brand-black text-white p-4 rounded-xl font-bold"
                    >
                        다시 주문하기
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full border-2 border-gray-200 p-4 rounded-xl font-bold"
                    >
                        홈으로
                    </button>
                </div>
            </div>
        </main>
    );
}
