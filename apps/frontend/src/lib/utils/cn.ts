import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * className 유틸리티 함수
 * clsx와 tailwind-merge를 결합하여 조건부 className을 병합하고 충돌을 제거합니다.
 *
 * @example
 * cn('bg-red-500', 'bg-blue-500') // => 'bg-blue-500'
 * cn('px-4 py-2', condition && 'bg-primary') // => 'px-4 py-2 bg-primary' (condition이 true일 때)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
