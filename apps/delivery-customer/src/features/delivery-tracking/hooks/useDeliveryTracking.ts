import { useState, useEffect } from 'react';
import { DeliveryInfo, DeliveryStatus } from '../types';
import { showNotification } from '@/lib/capacitor/local-notifications';
import { hapticsSuccess, hapticsMedium } from '@/lib/capacitor/haptics';
import { platform } from '@/lib/capacitor';
import { DELIVERY_STATUS_NOTIFICATIONS } from '../types';

/**
 * 배달 추적 Hook
 */
export function useDeliveryTracking(orderId: string) {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: 실제 API 연동
    // 여기서는 Mock 데이터 사용
    const fetchDeliveryInfo = async () => {
      try {
        setLoading(true);

        // Mock API 호출
        const response = await fetch(`/api/delivery/${orderId}`);
        const data = await response.json();

        setDeliveryInfo(data);
      } catch (err) {
        setError('배달 정보를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryInfo();

    // Realtime 구독 (Supabase Realtime 사용 예정)
    // const subscription = supabase
    //   .channel(`delivery:${orderId}`)
    //   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, handleDeliveryUpdate)
    //   .subscribe();

    // return () => {
    //   subscription.unsubscribe();
    // };
  }, [orderId]);

  /**
   * 배달 상태 업데이트 처리
   */
  const handleDeliveryUpdate = (newStatus: DeliveryStatus) => {
    if (!deliveryInfo) return;

    const notification = DELIVERY_STATUS_NOTIFICATIONS[newStatus];

    // 푸시 알림 표시
    if (platform.isNative) {
      showNotification({
        title: notification.title,
        body: notification.body,
      });

      // 진동 피드백
      if (notification.vibrate) {
        hapticsSuccess();
      }
    }

    // 상태 업데이트
    setDeliveryInfo({
      ...deliveryInfo,
      status: newStatus,
      timeline: [
        ...deliveryInfo.timeline,
        {
          status: newStatus,
          timestamp: new Date(),
          message: notification.body,
        },
      ],
    });
  };

  /**
   * 라이더에게 전화 걸기
   */
  const callRider = () => {
    if (!deliveryInfo?.rider?.phone) return;

    // 전화 걸기
    if (platform.isNative) {
      window.location.href = `tel:${deliveryInfo.rider.phone}`;
    } else {
      alert(`라이더 전화번호: ${deliveryInfo.rider.phone}`);
    }
  };

  /**
   * 배달 취소 요청
   */
  const cancelDelivery = async () => {
    try {
      const response = await fetch(`/api/delivery/${orderId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        handleDeliveryUpdate('CANCELLED');
      }
    } catch (err) {
      alert('배달 취소에 실패했습니다');
    }
  };

  return {
    deliveryInfo,
    loading,
    error,
    callRider,
    cancelDelivery,
  };
}
