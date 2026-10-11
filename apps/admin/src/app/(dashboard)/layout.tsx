'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import { usePathname } from 'next/navigation';
import { canAccessAdmin, canAccessPath } from '@/lib/adminPermissions';
import { OrderAlertControls } from '@/components/dashboard/OrderAlertControls';
import { PcAppDownloadButton } from '@/components/dashboard/PcAppDownloadButton';
import { PendingOrderAlarm } from '@/components/dashboard/PendingOrderAlarm';
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
  const { user, profile, loading, profileError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { selectedStoreId, isStoresError, refetchStores } = useAdminStore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // 서버 장애로 권한을 확인하지 못한 것이지 권한이 없는 게 아니다 — 승인 대기로 보내지 않는다
    if (!loading && user && profileError) return;

    if (!loading && user && (!profile || !canAccessAdmin(profile))) {
      if (pathname !== '/pending') router.push('/pending');
      return;
    }

    if (!loading && user && profile && !canAccessPath(profile, pathname)) {
      router.replace('/');
    }
  }, [user, profile, loading, profileError, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;
  if (profileError) return <ProfileLoadError />;
  if (profile && !canAccessPath(profile, pathname)) return null;

  const isSetupPage = pathname === '/pending';

  return (
    <div className="flex h-dvh bg-gray-50">
      {!isSetupPage && <Sidebar />}
      <main className={cn("min-w-0 flex-1 overflow-y-auto p-4 xl:p-8", isSetupPage && "flex items-center justify-center")}>
        {!isSetupPage && (
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3 xl:mb-8">
            <h1 className="flex min-h-11 items-center pl-14 text-xl font-bold text-gray-800 xl:pl-0 xl:text-2xl">관리자 대시보드</h1>
            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
              <PcAppDownloadButton />
              <OrderAlertControls />
            </div>
          </header>
        )}
        {!isSetupPage && <PendingOrderAlarm />}
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

function ProfileLoadError() {
  const { refreshProfile, signOut } = useAuth();
  const [retrying, setRetrying] = React.useState(false);

  const retry = async () => {
    setRetrying(true);
    await refreshProfile();
    setRetrying(false);
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-xl" role="alert" data-testid="admin-profile-load-error">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">서버에 연결할 수 없습니다</h2>
          <p className="mt-2 text-sm text-gray-500">
            계정 권한을 확인하지 못했습니다. 계정 문제가 아니라 서버 오류일 수 있으니 잠시 후 다시 시도해 주세요.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={retry}
            disabled={retrying}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {retrying ? '확인 중…' : '다시 시도'}
          </button>
          <button type="button" onClick={signOut} className="text-sm text-gray-400 hover:text-gray-600">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

// cn 함수가 layout.tsx에 없을 수 있으므로 추가하거나 직접 클래스 작성
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
