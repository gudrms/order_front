'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handle = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error || !data.session) {
                router.replace('/login?error=auth_failed');
                return;
            }

            // 이메일 인증 완료 → 프로필 설정 페이지로
            router.replace('/setup');
        };

        handle();
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                <p className="text-gray-600 font-medium">이메일 인증 처리 중...</p>
            </div>
        </div>
    );
}
