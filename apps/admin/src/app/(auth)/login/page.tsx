'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
    const [signupMode, setSignupMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const switchToSignup = () => {
        setSignupMode(true);
        setError(null);
    };

    const switchToLogin = () => {
        setSignupMode(false);
        setError(null);
        setPasswordConfirm('');
    };

    const validate = (): string | null => {
        if (!validateEmail(email)) return '올바른 이메일 주소를 입력해주세요.';
        if (!password) return '비밀번호를 입력해주세요.';
        if (signupMode) {
            if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
            if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
        }
        return null;
    };

    const handleLogin = async () => {
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

    const handleSignup = async () => {
        if (!signupMode) {
            switchToSignup();
            return;
        }

        const err = validate();
        if (err) { setError(err); return; }

        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // 이메일 인증 비활성화 시 세션 즉시 생성 → /setup으로 이동
        // 이메일 인증 활성화 시 signupDone 상태 (인증 메일 안내)
        if (data.session) {
            router.push('/setup');
        } else {
            setError('인증 메일을 확인해주세요. (관리자에게 문의)');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-10 space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">관리자 로그인</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        {signupMode
                            ? '이메일과 비밀번호로 계정을 만드세요.'
                            : '매장 관리를 위해 로그인해주세요.'}
                    </p>
                </div>

                <div className="space-y-4">
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
                        autoComplete={signupMode ? 'new-password' : 'current-password'}
                        placeholder={signupMode ? '비밀번호 (8자 이상)' : '비밀번호'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                    />

                    {signupMode && (
                        <input
                            type="password"
                            autoComplete="new-password"
                            placeholder="비밀번호 확인"
                            value={passwordConfirm}
                            onChange={(e) => { setPasswordConfirm(e.target.value); setError(null); }}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                        />
                    )}

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={signupMode ? switchToLogin : handleLogin}
                            disabled={loading}
                            className="flex-1 rounded-lg border-2 border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading && !signupMode ? '로그인 중...' : '로그인'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSignup}
                            disabled={loading}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading && signupMode ? '처리 중...' : '회원가입'}
                        </button>
                    </div>

                    {signupMode && (
                        <p className="text-center text-xs text-gray-400">
                            가입 후 초대 코드를 입력하면 매장 관리자로 등록됩니다.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
