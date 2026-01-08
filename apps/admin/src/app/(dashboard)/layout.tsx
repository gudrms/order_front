'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // ⭐️ 프로필 정보가 없으면 /setup 으로 강제 이동 (단, 현재 페이지가 /setup 이 아닐 때만)
    if (!loading && user && (!profile || !profile.name || !profile.phoneNumber)) {
      if (pathname !== '/setup') {
        router.push('/setup');
      }
    }
  }, [user, profile, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  // 온보딩 중일 때는 사이드바 없이 전체 화면 사용 가능 (선택 사항)
  const isSetupPage = pathname === '/setup';

  return (
    <div className="flex h-screen bg-gray-50">
      {!isSetupPage && <Sidebar />}
      <main className={cn("flex-1 overflow-y-auto p-8", isSetupPage && "flex items-center justify-center")}>
        {!isSetupPage && (
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">관리자 대시보드</h1>
          </header>
        )}
        {children}
      </main>
    </div>
  );
}

// cn 함수가 layout.tsx에 없을 수 있으므로 추가하거나 직접 클래스 작성
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
