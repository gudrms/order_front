'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const authError = searchParams.get('error');

    const validate = (): string | null => {
        if (!validateEmail(email)) return '올바른 이메일 주소를 입력해주세요.';
        if (!password) return '비밀번호를 입력해주세요.';
        return null;
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.');
            setLoading(false);
        } else {
            router.push('/');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-10 space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">관리자 로그인</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        마스터 관리자가 발급한 계정으로 로그인해주세요.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="이메일 주소"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                    />
                    <input
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                    />

                    {(error || authError) && (
                        <div className="text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
                            {error ?? '인증에 실패했습니다. 다시 시도해주세요.'}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}
