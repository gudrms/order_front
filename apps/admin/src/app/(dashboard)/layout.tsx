'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { usePathname } from 'next/navigation';
import { canAccessAdmin, canAccessPath } from '@/lib/adminPermissions';
import { OrderAlertControls } from '@/components/dashboard/OrderAlertControls';
import { StaffCallNotification } from '@/components/dashboard/StaffCallNotification';
import { useStaffCalls } from '@/hooks/useStaffCalls';
import { useAdminStore } from '@/contexts/AdminStoreContext';

/** Realtime 구독은 레이아웃 마운트 시 한 번만 시작 */
function StaffCallRealtimeSubscriber() {
  useStaffCalls(); // 구독 + 쿼리 — 결과는 페이지에서 별도 useStaffCalls()로 소비
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { selectedStoreId } = useAdminStore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && user && (!profile || !canAccessAdmin(profile))) {
      if (pathname !== '/pending') router.push('/pending');
      return;
    }

    if (!loading && user && profile && !canAccessPath(profile, pathname)) {
      router.replace('/');
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
  if (profile && !canAccessPath(profile, pathname)) return null;

  const isSetupPage = pathname === '/pending';

  return (
    <div className="flex h-screen bg-gray-50">
      {!isSetupPage && <Sidebar />}
      <main className={cn("flex-1 overflow-y-auto p-8", isSetupPage && "flex items-center justify-center")}>
        {!isSetupPage && (
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-800">관리자 대시보드</h1>
            <OrderAlertControls />
          </header>
        )}
        {children}
      </main>

      {/* 직원 호출 Realtime 구독 (전역 — 페이지 이동과 무관하게 유지) */}
      {selectedStoreId && <StaffCallRealtimeSubscriber />}
      {/* 직원 호출 토스트 알림 */}
      <StaffCallNotification />
    </div>
  );
}

// cn 함수가 layout.tsx에 없을 수 있으므로 추가하거나 직접 클래스 작성
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
