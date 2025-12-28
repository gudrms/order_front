import { useEffect, useState, RefObject } from 'react';

/**
 * 현재 화면에 보이는 섹션을 추적하는 커스텀 훅
 * Intersection Observer를 사용하여 활성 섹션 감지
 */
export function useActiveSection(
  sectionRefs: Map<string, RefObject<HTMLElement | null>>,
  options?: IntersectionObserverInit
) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  useEffect(() => {
    // Intersection Observer 설정
    const observer = new IntersectionObserver(
      (entries) => {
        // 화면에 보이는 섹션들 찾기
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          // 가장 많이 보이는 섹션 찾기
          const mostVisible = visibleEntries.reduce((prev, current) => {
            return current.intersectionRatio > prev.intersectionRatio
              ? current
              : prev;
          });

          // 카테고리 ID 추출
          const categoryId =
            mostVisible.target.getAttribute('data-category-id');
          if (categoryId) {
            setActiveCategoryId(categoryId); // 문자열 그대로 사용
          }
        }
      },
      {
        // 루트 마진: 상단에서 20% 지점을 기준으로
        rootMargin: '-20% 0px -80% 0px',
        // 임계값: 10% 이상 보일 때
        threshold: [0, 0.1, 0.5, 1],
        ...options,
      }
    );

    // 모든 섹션 관찰 시작
    sectionRefs.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    // 정리
    return () => {
      observer.disconnect();
    };
  }, [sectionRefs, options]);

  return activeCategoryId;
}
