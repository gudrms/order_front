import { App } from '@capacitor/app';
import { isNative } from './index';

/**
 * 앱 상태 리스너 추가
 */
export function addAppStateListener(
  callback: (isActive: boolean) => void
) {
  if (!isNative) {
    // 웹에서는 visibilitychange 이벤트 사용
    const handleVisibilityChange = () => {
      callback(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  // 네이티브 앱
  const listener = App.addListener('appStateChange', ({ isActive }) => {
    callback(isActive);
  });

  return () => listener.remove();
}

/**
 * 뒤로 가기 버튼 리스너 (Android)
 */
export function addBackButtonListener(callback: () => void) {
  if (!isNative) return () => {};

  const listener = App.addListener('backButton', () => {
    callback();
  });

  return () => listener.remove();
}

/**
 * 앱 버전 정보
 */
export async function getAppInfo() {
  if (!isNative) {
    return {
      version: '1.0.0 (Web)',
      build: '1',
    };
  }

  try {
    const info = await App.getInfo();
    return {
      version: info.version,
      build: info.build,
    };
  } catch (error) {
    console.error('앱 정보 가져오기 실패:', error);
    return { version: 'Unknown', build: 'Unknown' };
  }
}

/**
 * 앱 종료 (Android만)
 */
export async function exitApp() {
  if (!isNative) return;

  try {
    await App.exitApp();
  } catch (error) {
    console.error('앱 종료 실패:', error);
  }
}
