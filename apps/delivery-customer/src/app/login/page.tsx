'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const { user, loading, signInWithKakao, signInWithApple } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // 이미 로그인된 경우 메인으로
        if (user && !loading) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleKakaoLogin = async () => {
        try {
            await signInWithKakao();
        } catch (error) {
            console.error('카카오 로그인 실패:', error);
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleAppleLogin = async () => {
        try {
            await signInWithApple();
        } catch (error) {
            console.error('Apple 로그인 실패:', error);
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-yellow mx-auto mb-4" />
                    <p className="text-lg font-medium">로딩 중...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-brand-yellow/20 to-white flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* 로고 & 타이틀 */}
                <div className="text-center mb-12">
                    <div className="text-7xl mb-4">🛵</div>
                    <h1 className="text-3xl font-bold text-brand-black mb-2">배달 주문</h1>
                    <p className="text-gray-600">간편하게 주문하고 빠르게 받아보세요</p>
                </div>

                {/* 로그인 버튼들 */}
                <div className="space-y-3">
                    {/* 카카오 로그인 */}
                    <button
                        onClick={handleKakaoLogin}
                        className="w-full bg-[#FEE500] text-[#000000] p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#FDD835] transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3C6.486 3 2 6.382 2 10.5c0 2.658 1.832 4.98 4.582 6.243-.217.792-.706 2.595-.815 3.017-.132.514.189.508.396.37.16-.106 2.613-1.756 3.618-2.417.7.096 1.416.147 2.146.147 5.514 0 9.973-3.382 9.973-7.55S17.514 3 12 3z" />
                        </svg>
                        카카오 로그인
                    </button>

                    {/* Apple 로그인 (iOS 앱 출시용 뼈대) */}
                    <button
                        onClick={handleAppleLogin}
                        className="w-full bg-black text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                        Apple로 로그인
                    </button>
                </div>

                {/* 안내 문구 */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>로그인하면 서비스 이용약관 및</p>
                    <p>개인정보처리방침에 동의하는 것으로 간주합니다.</p>
                </div>

                {/* 게스트로 계속하기 (선택) */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-600 underline text-sm"
                    >
                        로그인 없이 둘러보기
                    </button>
                </div>
            </div>
        </main>
    );
}
