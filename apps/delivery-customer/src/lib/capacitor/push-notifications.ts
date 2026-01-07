import {
  PushNotifications,
  Token,
  PushNotificationSchema,
} from '@capacitor/push-notifications';
import { isNative } from './index';

/**
 * 푸시 알림 초기화
 */
export async function initPushNotifications() {
  if (!isNative) {
    console.warn('푸시 알림은 네이티브 앱에서만 사용 가능합니다.');
    return;
  }

  try {
    // 권한 요청
    const result = await PushNotifications.requestPermissions();

    if (result.receive === 'granted') {
      // 푸시 등록
      await PushNotifications.register();
    }

    // 토큰 수신 리스너
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('푸시 토큰:', token.value);
      // TODO: 서버에 토큰 전송
    });

    // 알림 수신 리스너 (앱이 foreground일 때)
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('알림 수신:', notification);
        // TODO: 알림 표시 로직
      }
    );

    // 알림 클릭 리스너
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('알림 클릭:', notification);
        // TODO: 알림 클릭 시 동작
      }
    );
  } catch (error) {
    console.error('푸시 알림 초기화 실패:', error);
  }
}

/**
 * 푸시 알림 구독 해제
 */
export async function unregisterPushNotifications() {
  if (!isNative) return;

  try {
    await PushNotifications.removeAllListeners();
  } catch (error) {
    console.error('푸시 알림 구독 해제 실패:', error);
  }
}
