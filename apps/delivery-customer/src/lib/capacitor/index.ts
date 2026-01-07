import { Capacitor } from '@capacitor/core';

/**
 * 현재 플랫폼 확인
 */
export const isNative = Capacitor.isNativePlatform();
export const isWeb = !isNative;
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';

/**
 * 플랫폼 정보
 */
export const platform = {
  isNative,
  isWeb,
  isIOS,
  isAndroid,
  name: Capacitor.getPlatform(),
};

/**
 * 플랫폼별 분기 처리 유틸
 */
export function platformSwitch<T>(options: {
  native?: T;
  web?: T;
  ios?: T;
  android?: T;
  default: T;
}): T {
  if (options.ios && isIOS) return options.ios;
  if (options.android && isAndroid) return options.android;
  if (options.native && isNative) return options.native;
  if (options.web && isWeb) return options.web;
  return options.default;
}
