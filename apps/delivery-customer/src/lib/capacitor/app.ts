import { App } from '@capacitor/app';
import { isNative } from './index';

/**
 * 딥링크/유니버설 링크 리스너
 * Android App Links / iOS Universal Links / Custom Scheme 모두 처리.
 * callback 에 전달되는 url 예시:
 *   - https://delivery.tacomole.kr/orders/abc123
 *   - taco://orders/abc123
 */
export function addDeepLinkListener(callback: (url: string) => void): () => void {
  if (!isNative) return () => {};

  const listenerPromise = App.addListener('appUrlOpen', ({ url }) => {
    callback(url);
  });

  return () => {
    listenerPromise.then((handle) => handle.remove());
  };
}

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
  const listenerPromise = App.addListener('appStateChange', ({ isActive }) => {
    callback(isActive);
  });

  return () => {
    listenerPromise.then(handle => handle.remove());
  };
}

/**
 * 뒤로 가기 버튼 리스너 (Android)
 */
export function addBackButtonListener(callback: () => void) {
  if (!isNative) return () => {};

  const listenerPromise = App.addListener('backButton', () => {
    callback();
  });

  return () => {
    listenerPromise.then(handle => handle.remove());
  };
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
