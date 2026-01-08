'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@order/shared';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // OAuth 콜백 처리
        const handleCallback = async () => {
            const { error } = await supabase.auth.getSession();

            if (error) {
                console.error('인증 오류:', error);
                router.push('/login?error=auth_failed');
            } else {
                // 로그인 성공 - 메인 페이지로 리다이렉트
                router.push('/');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-yellow mx-auto mb-4" />
                <p className="text-lg font-medium">로그인 처리 중...</p>
            </div>
        </main>
    );
}
