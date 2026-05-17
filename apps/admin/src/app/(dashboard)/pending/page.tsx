'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Clock, LogOut } from 'lucide-react';

export default function PendingPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">승인 대기 중</h2>
        <p className="mt-2 text-sm text-gray-500">
          관리자 계정은 마스터 관리자가 직접 생성하고 권한을 부여합니다.
          권한이 부여되면 다시 로그인해주세요.
        </p>
        {profile?.email && (
          <p className="mt-1 text-xs text-gray-400">{profile.email}</p>
        )}
      </div>

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
