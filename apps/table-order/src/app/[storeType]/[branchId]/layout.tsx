import { redirect } from 'next/navigation';
import { getDefaultStoreType, getDefaultBranchId, getStoreUrl } from '@/lib/utils/store';

interface StoreLayoutProps {
  params: Promise<{
    storeType: string;
    branchId: string;
  }>;
  children: React.ReactNode;
}

/**
 * 매장별 레이아웃
 * Phase 1: 환경변수와 일치하는지 검증만 수행
 * Phase 2: DB에서 매장 정보 조회 및 Context 제공
 */
export default async function StoreLayout({ params, children }: StoreLayoutProps) {
  const { storeType, branchId } = await params;

  // Phase 1: 환경변수 검증
  const defaultStoreType = getDefaultStoreType();
  const defaultBranchId = getDefaultBranchId();

  // 환경변수와 다른 매장 접근 시 기본 매장으로 리다이렉트
  if (storeType !== defaultStoreType || branchId !== defaultBranchId) {
    redirect(getStoreUrl('/menu'));
  }

  // Phase 2에서 추가될 기능:
  // - DB에서 매장 정보 조회
  // - 매장이 없으면 404
  // - 매장 정보를 Context로 제공
  // const store = await db.store.findUnique({
  //   where: { storeType_branchId: { storeType, branchId } }
  // });
  // if (!store) notFound();

  return <>{children}</>;
}
