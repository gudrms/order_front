'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Tab = 'login' | 'signup';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);
  const router = useRouter();

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setError(null);
    setSignupDone(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // 이메일 인증이 비활성화된 경우 세션이 바로 생김
    if (data.session) {
      router.push('/setup');
    } else {
      setSignupDone(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {tab === 'login' ? '관리자 로그인' : '회원가입'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {tab === 'login' ? '매장 관리를 위해 로그인해주세요.' : '이메일과 비밀번호로 계정을 만드세요.'}
          </p>
        </div>
        {/*테스트 pr*/}
        {/* 탭 */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('signup')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'signup'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            회원가입
          </button>
        </div>

        {signupDone ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📧</div>
            <p className="text-gray-800 font-medium">인증 메일을 발송했습니다.</p>
            <p className="text-sm text-gray-500">
              <strong>{email}</strong>로 발송된 링크를 클릭해 인증을 완료한 뒤 로그인해주세요.
            </p>
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className="text-blue-600 text-sm hover:underline"
            >
              로그인 화면으로 돌아가기
            </button>
          </div>
        ) : (
          <form
            className="mt-8 space-y-6"
            onSubmit={tab === 'login' ? handleLogin : handleSignup}
          >
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  이메일 주소
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  className="relative block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={tab === 'signup' ? 6 : undefined}
                  className="relative block w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder={tab === 'signup' ? '비밀번호 (6자 이상)' : '비밀번호'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? tab === 'login' ? '로그인 중...' : '가입 중...'
                  : tab === 'login' ? '로그인' : '회원가입'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
