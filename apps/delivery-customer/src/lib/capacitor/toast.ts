import { Toast } from '@capacitor/toast';
import { isNative } from './index';

/**
 * 토스트 메시지 표시
 */
export async function showToast(
  text: string,
  duration: 'short' | 'long' = 'short'
) {
  if (!isNative) {
    // 웹에서는 간단한 alert 또는 커스텀 토스트 사용
    console.log('Toast:', text);
    // TODO: 웹용 토스트 UI 컴포넌트 추가
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
