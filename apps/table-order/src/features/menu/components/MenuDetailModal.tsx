'use client';

import { useUIStore } from '@/stores';
import { Modal } from '@/components/ui/Modal';
import { MenuDetailContent } from './MenuDetailContent';

/**
 * 메뉴 상세 모달
 * - 중앙에 표시되는 모달
 * - selectedMenuId가 있을 때만 표시
 */
export function MenuDetailModal() {
  const { selectedMenuId, closeMenuDetail } = useUIStore();

  return (
    <Modal
      isOpen={!!selectedMenuId}
      onClose={closeMenuDetail}
      className="max-w-md p-0"
    >
      {selectedMenuId && (
        <div className="max-h-[85vh] overflow-y-auto">
          <MenuDetailContent menuId={selectedMenuId} />
        </div>
      )}
    </Modal>
  );
}
