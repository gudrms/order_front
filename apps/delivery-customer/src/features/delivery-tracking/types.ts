/**
 * 배달 상태
 */
export type DeliveryStatus =
  | 'PENDING'      // 접수 대기
  | 'ACCEPTED'     // 접수 완료
  | 'PREPARING'    // 조리 중
  | 'READY'        // 조리 완료
  | 'PICKING_UP'   // 픽업 중
  | 'DELIVERING'   // 배달 중
  | 'ARRIVED'      // 도착
  | 'COMPLETED'    // 완료
  | 'CANCELLED';   // 취소

/**
 * 배달 정보
 */
export interface DeliveryInfo {
  orderId: string;
  orderNumber: string;
  status: DeliveryStatus;
  estimatedTime: number; // 예상 소요 시간 (분)
  rider?: {
    id: string;
    name: string;
    phone: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    vehicle: 'BIKE' | 'SCOOTER' | 'CAR';
  };
  timeline: DeliveryTimeline[];
}

/**
 * 배달 타임라인
 */
export interface DeliveryTimeline {
  status: DeliveryStatus;
  timestamp: Date;
  message: string;
}

/**
 * 배달 상태별 메시지
 */
export const DELIVERY_STATUS_MESSAGES: Record<DeliveryStatus, string> = {
  PENDING: '주문이 접수 대기 중입니다',
  ACCEPTED: '주문이 접수되었습니다',
  PREPARING: '음식을 준비하고 있습니다',
  READY: '음식이 준비되었습니다',
  PICKING_UP: '라이더가 음식을 픽업하러 가고 있습니다',
  DELIVERING: '라이더가 배달 중입니다',
  ARRIVED: '라이더가 도착했습니다',
  COMPLETED: '배달이 완료되었습니다',
  CANCELLED: '주문이 취소되었습니다',
};

/**
 * 배달 상태별 알림 설정
 */
export const DELIVERY_STATUS_NOTIFICATIONS: Record<
  DeliveryStatus,
  { title: string; body: string; vibrate: boolean }
> = {
  PENDING: {
    title: '주문 접수 대기',
    body: '매장에서 주문을 확인하고 있습니다.',
    vibrate: false,
  },
  ACCEPTED: {
    title: '주문 접수 완료!',
    body: '매장에서 주문을 접수했습니다.',
    vibrate: true,
  },
  PREPARING: {
    title: '조리 시작!',
    body: '맛있게 준비하고 있어요.',
    vibrate: false,
  },
  READY: {
    title: '조리 완료!',
    body: '음식이 준비되었습니다. 곧 배달 시작합니다.',
    vibrate: true,
  },
  PICKING_UP: {
    title: '픽업 중',
    body: '라이더가 매장으로 이동 중입니다.',
    vibrate: false,
  },
  DELIVERING: {
    title: '🚚 배달 시작!',
    body: '라이더가 배달을 시작했습니다.',
    vibrate: true,
  },
  ARRIVED: {
    title: '🔔 라이더 도착!',
    body: '라이더가 도착했습니다. 문 앞에서 확인해주세요!',
    vibrate: true,
  },
  COMPLETED: {
    title: '✅ 배달 완료!',
    body: '맛있게 드세요!',
    vibrate: true,
  },
  CANCELLED: {
    title: '주문 취소',
    body: '주문이 취소되었습니다.',
    vibrate: false,
  },
};
