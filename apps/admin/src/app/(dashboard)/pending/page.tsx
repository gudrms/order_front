'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Loader2, Ticket, Clock, CheckCircle2, LogOut } from 'lucide-react';

export default function PendingPage() {
  const { user, session, profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session || !inviteCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          id: user.id,
          email: user.email,
          name: profile?.name,
          phoneNumber: profile?.phoneNumber,
          inviteCode: inviteCode.trim().toUpperCase(),
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      await refreshProfile();
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '유효하지 않은 초대코드입니다. 다시 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">승인 대기 중</h2>
        <p className="mt-2 text-sm text-gray-500">
          관리자에게 초대코드를 받아 입력하시면 매장 관리를 시작할 수 있습니다.
        </p>
        {profile?.email && (
          <p className="mt-1 text-xs text-gray-400">{profile.email}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
            초대코드
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Ticket className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="inviteCode"
              type="text"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase placeholder-gray-400"
              placeholder="TACOMOLLY-GIMPO-XXXXXXXX"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            대소문자 구분 없이 입력하세요.
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !inviteCode.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              초대코드 확인 및 시작하기
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-gray-100 text-center">
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  );
}
