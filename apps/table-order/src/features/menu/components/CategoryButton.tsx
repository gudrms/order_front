import { cn } from '@/lib/utils/cn';

interface CategoryButtonProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'horizontal' | 'vertical'; // TopBar용 vs Sidebar용
}

/**
 * 카테고리 버튼 컴포넌트
 * TopBar(가로) 및 Sidebar(세로)에서 재사용
 */
export function CategoryButton({
  name,
  isActive,
  onClick,
  variant = 'horizontal',
}: CategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'font-medium transition-colors',
        // 가로 버전 (TopBar)
        variant === 'horizontal' && 'rounded-lg px-4 py-2 whitespace-nowrap',
        // 세로 버전 (Sidebar)
        variant === 'vertical' && 'w-full rounded-md px-4 py-3 text-left',
        // Active 상태
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      )}
    >
      {name}
    </button>
  );
}
