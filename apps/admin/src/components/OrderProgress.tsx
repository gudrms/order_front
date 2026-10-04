import type { Order } from '@order/shared';

const DELIVERY_STEPS = ['접수 대기', '조리 중', '배달 준비', '배달 중', '완료'];
const TABLE_STEPS = ['접수 대기', '조리 중', '완료'];

function getStepIndex(order: Order): number {
  const isDelivery = order.type === 'DELIVERY';
  switch (order.status) {
    case 'PENDING':
    case 'PAID':
      return 0;
    case 'CONFIRMED':
    case 'COOKING':
    case 'PREPARING':
      return 1;
    case 'READY':
      return isDelivery ? 2 : 1;
    case 'DELIVERING':
      return 3;
    case 'COMPLETED':
      return isDelivery ? 4 : 2;
    default:
      return -1;
  }
}

/**
 * 주문 진행 막대 — 지금 몇 번째 단계인지 한눈에 보이게 한다.
 * 결제 대기·취소처럼 흐름 밖의 상태는 -1을 돌려 호출부가 뱃지로 보여준다.
 */
export function OrderProgress({ order }: { order: Order }) {
  const steps = order.type === 'DELIVERY' ? DELIVERY_STEPS : TABLE_STEPS;
  const current = getStepIndex(order);
  const isDone = current === steps.length - 1;

  return (
    <div className="w-40" data-testid={`admin-order-progress-${order.id}`}>
      <p className={`mb-1.5 text-xs font-bold ${current === 0 ? 'text-red-600' : isDone ? 'text-green-700' : 'text-blue-700'}`}>
        {steps[current]}
      </p>
      <div className="flex gap-1" aria-label={`${steps.length}단계 중 ${current + 1}단계: ${steps[current]}`}>
        {steps.map((step, index) => (
          <div
            key={step}
            title={step}
            className={`h-1.5 flex-1 rounded-full ${
              index > current
                ? 'bg-gray-200'
                : current === 0
                  ? 'bg-red-500'
                  : isDone
                    ? 'bg-green-500'
                    : 'bg-blue-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function isInOrderFlow(order: Order) {
  return getStepIndex(order) >= 0;
}
