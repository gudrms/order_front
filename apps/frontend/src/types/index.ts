/**
 * @deprecated
 * 이 파일은 하위 호환성을 위해 유지됩니다.
 * 새 코드에서는 @order/shared를 직접 import하세요.
 *
 * 사용 예:
 * // ✅ 권장
 * import { Menu, Order, ORDER_STATUS_LABEL } from '@order/shared';
 *
 * // ❌ 레거시 (동작은 하지만 권장하지 않음)
 * import { Menu, Order } from '@/types';
 */

// @order/shared로 리다이렉트
export * from '@order/shared';

// 호출 타입 (Frontend 전용)
export type { CallType, CallStatus, Call, CreateCallRequest } from './call';
export { CallTypeLabel, CallStatusLabel } from './call';
