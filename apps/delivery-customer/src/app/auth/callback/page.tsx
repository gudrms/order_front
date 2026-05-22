'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@order/shared/lib/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // OAuth 콜백 처리
        const handleCallback = async () => {
            const code = new URLSearchParams(window.location.search).get('code');
            console.info('[AuthCallback] opened', {
                hasCode: !!code,
                hasHash: !!window.location.hash,
            });

            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error('인증 코드 교환 오류:', error);
                    router.push('/login?error=auth_failed');
                    return;
                }
                console.info('[AuthCallback] OAuth code session restored');
            }

            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();
            console.info('[AuthCallback] session checked', {
                hasSession: !!session,
                hasUser: !!session?.user,
                provider: session?.user.app_metadata?.provider ?? null,
            });

            if (error) {
                console.error('인증 오류:', error);
                router.push('/login?error=auth_failed');
            } else {
                const redirect = sessionStorage.getItem('auth_redirect');
                sessionStorage.removeItem('auth_redirect');
                router.push(redirect || '/');
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
