import {
  LocalNotifications,
  ScheduleOptions,
} from '@capacitor/local-notifications';
import { isNative } from './index';

/**
 * 로컬 알림 권한 요청
 */
export async function requestNotificationPermissions() {
  if (!isNative) return 'denied';

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display;
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return 'denied';
  }
}

/**
 * 즉시 알림 표시
 */
export async function showNotification(options: {
  title: string;
  body: string;
  id?: number;
}) {
  if (!isNative) {
    console.warn('로컬 알림은 네이티브 앱에서만 사용 가능합니다.');
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: options.id || Date.now(),
          title: options.title,
          body: options.body,
          schedule: { at: new Date(Date.now() + 1000) }, // 1초 후
        },
      ],
    });
  } catch (error) {
    console.error('알림 표시 실패:', error);
  }
}

/**
 * 예약 알림 (특정 시간)
 */
export async function scheduleNotification(options: {
  title: string;
  body: string;
  at: Date;
  id?: number;
}) {
  if (!isNative) return;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: options.id || Date.now(),
          title: options.title,
          body: options.body,
          schedule: { at: options.at },
        },
      ],
    });
  } catch (error) {
    console.error('알림 예약 실패:', error);
  }
}

/**
 * 알림 취소
 */
export async function cancelNotification(id: number) {
  if (!isNative) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (error) {
    console.error('알림 취소 실패:', error);
  }
}

/**
 * 배달 도착 알림 (예시)
 */
export async function notifyDeliveryArriving(estimatedMinutes: number) {
  const arrivalTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);

  await showNotification({
    title: '🚚 배달이 곧 도착해요!',
    body: `약 ${estimatedMinutes}분 후 도착 예정입니다.`,
  });

  // 도착 1분 전 알림 예약
  if (estimatedMinutes > 1) {
    await scheduleNotification({
      title: '🔔 배달이 거의 다 왔어요!',
      body: '곧 도착하니 문 앞에서 기다려주세요.',
      at: new Date(arrivalTime.getTime() - 60 * 1000),
    });
  }
}
