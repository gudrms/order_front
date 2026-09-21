import { Toast } from '@capacitor/toast';
import { isNative } from './index';
import { showWebToast } from '../webToast';

// Android Toast의 SHORT/LONG에 맞춘 값. 웹에서도 체감이 비슷하도록 같은 길이를 쓴다.
const WEB_TOAST_DURATION_MS = { short: 2000, long: 3500 } as const;

/**
 * 토스트 메시지 표시
 *
 * 네이티브는 Capacitor Toast, 웹은 `ToastHost`가 그리는 인앱 토스트를 쓴다.
 */
export async function showToast(
  text: string,
  duration: 'short' | 'long' = 'short'
) {
  if (!isNative) {
    showWebToast(text, WEB_TOAST_DURATION_MS[duration]);
    return;
  }

  try {
    await Toast.show({
      text,
      duration: duration,
      position: 'bottom',
    });
  } catch (error) {
    console.error('토스트 표시 실패:', error);
  }
}

/**
 * 성공 토스트
 */
export async function showSuccessToast(message: string) {
  await showToast(`✅ ${message}`, 'short');
}

/**
 * 에러 토스트
 */
export async function showErrorToast(message: string) {
  await showToast(`❌ ${message}`, 'long');
}

/**
 * 정보 토스트
 */
export async function showInfoToast(message: string) {
  await showToast(`ℹ️ ${message}`, 'short');
}
