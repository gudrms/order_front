import { notFound, redirect } from 'next/navigation';
import { getDefaultStoreType, getDefaultBranchId, getStoreUrl } from '@/lib/utils/store';
import { StoreProvider } from '@/contexts/StoreContext';
import { DOMAINS } from '@/lib/constants/domains';

interface StoreLayoutProps {
  params: Promise<{
    storeType: string;
    branchId: string;
  }>;
  children: React.ReactNode;
}

async function getStore(storeType: string, branchId: string) {
  try {
    const res = await fetch(`${DOMAINS.API}/stores/identifier/${storeType}/${branchId}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.data || json; // Handle potential wrapper
  } catch (error) {
    console.error('Failed to fetch store:', error);
    return null;
  }
}

/**
 * 매장별 레이아웃
 * DB에서 매장 정보를 조회하여 Context로 제공합니다.
 */
export default async function StoreLayout({ params, children }: StoreLayoutProps) {
  const { storeType, branchId } = await params;

  // 1. 환경변수 검증 (Phase 1 호환성 유지)
  const defaultStoreType = getDefaultStoreType();
  const defaultBranchId = getDefaultBranchId();

  if (storeType !== defaultStoreType || branchId !== defaultBranchId) {
    // 개발 환경에서는 편의를 위해 리다이렉트하지만, 
    // 실제로는 DB 조회가 우선되어야 할 수도 있음.
    // 일단 기존 로직 유지
    redirect(getStoreUrl('/menu'));
  }

  // 2. DB에서 매장 정보 조회
  const store = await getStore(storeType, branchId);

  if (!store) {
    notFound();
  }

  return (
    <StoreProvider store={store}>
      {children}
    </StoreProvider>
  );
}
