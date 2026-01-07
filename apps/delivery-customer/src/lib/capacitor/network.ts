import { Network } from '@capacitor/network';
import { isNative } from './index';

/**
 * 네트워크 상태 확인
 */
export async function getNetworkStatus() {
  if (!isNative) {
    // 웹에서는 navigator API 사용
    return {
      connected: navigator.onLine,
      connectionType: 'wifi',
    };
  }

  try {
    const status = await Network.getStatus();
    return status;
  } catch (error) {
    console.error('네트워크 상태 확인 실패:', error);
    return { connected: true, connectionType: 'unknown' };
  }
}

/**
 * 네트워크 연결 리스너 추가
 */
export function addNetworkListener(
  callback: (connected: boolean) => void
) {
  if (!isNative) {
    // 웹에서는 online/offline 이벤트 사용
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  // 네이티브 앱
  const listener = Network.addListener('networkStatusChange', (status) => {
    callback(status.connected);
  });

  return () => listener.remove();
}

/**
 * 오프라인 체크
 */
export async function isOffline() {
  const status = await getNetworkStatus();
  return !status.connected;
}
