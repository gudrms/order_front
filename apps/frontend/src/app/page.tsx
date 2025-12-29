import { redirect } from 'next/navigation';
import { getStoreUrl } from '@/lib/utils/store';

/**
 * 랜딩 페이지
 * 개발 환경: 환경변수로 설정된 기본 매장으로 자동 리다이렉트
 * 프로덕션: 매장 선택 페이지 또는 안내 페이지 (Phase 2에서 구현)
 */
export default function HomePage() {
  // Phase 1: 개발 환경에서 자동 리다이렉트
  if (process.env.NODE_ENV === 'development') {
    redirect(getStoreUrl('/menu'));
  }

  // Phase 2: 프로덕션에서는 매장 선택 페이지로 변경 예정
  redirect(getStoreUrl('/menu'));
}
