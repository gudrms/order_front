'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { usePathname } from 'next/navigation';
import { canAccessAdmin, canAccessPath } from '@/lib/adminPermissions';
import { OrderAlertControls } from '@/components/dashboard/OrderAlertControls';
import { StaffCallNotification } from '@/components/dashboard/StaffCallNotification';
import { useStaffCallRealtimeSubscription } from '@/hooks/useStaffCalls';
import { useAdminStore } from '@/contexts/AdminStoreContext';

/**
 * Realtime 구독은 레이아웃 마운트 시 한 번만 시작.
 * /calls 페이지 등이 별도로 useStaffCalls()(쿼리 전용)를 호출해도
 * Supabase 채널 구독은 여기서만 생겨 새 호출 토스트가 중복되지 않는다.
 */
function StaffCallRealtimeSubscriber() {
  useStaffCallRealtimeSubscription();
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
  const { selectedStoreId, isStoresError, refetchStores } = useAdminStore();

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
        {!isSetupPage && isStoresError && (
          <div
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            data-testid="admin-stores-fetch-error"
          >
            <span>매장 목록을 불러오지 못했습니다. 이 화면과 다른 모든 화면이 "매장 없음"/빈 목록으로 보이는 건 실제로 매장이 없어서가 아니라 조회가 실패한 상태일 수 있습니다.</span>
            <button
              type="button"
              onClick={() => refetchStores()}
              className="rounded px-2 py-1 text-xs font-semibold opacity-70 hover:bg-white/60 hover:opacity-100"
            >
              다시 시도
            </button>
          </div>
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
