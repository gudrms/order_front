import { Geolocation } from '@capacitor/geolocation';
import { isNative } from './index';

/**
 * 현재 위치 가져오기
 */
export async function getCurrentPosition() {
  if (!isNative) {
    console.warn('위치 정보는 네이티브 앱에서만 사용 가능합니다.');
    return null;
  }

  try {
    const position = await Geolocation.getCurrentPosition();
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    console.error('위치 정보 가져오기 실패:', error);
    return null;
  }
}

/**
 * 위치 권한 확인
 */
export async function checkPermissions() {
  try {
    const status = await Geolocation.checkPermissions();
    return status.location;
  } catch (error) {
    console.error('권한 확인 실패:', error);
    return 'denied';
  }
}

/**
 * 위치 권한 요청
 */
export async function requestPermissions() {
  try {
    const status = await Geolocation.requestPermissions();
    return status.location;
  } catch (error) {
    console.error('권한 요청 실패:', error);
    return 'denied';
  }
}
