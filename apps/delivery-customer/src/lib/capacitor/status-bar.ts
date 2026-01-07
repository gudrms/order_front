import { StatusBar, Style } from '@capacitor/status-bar';
import { isNative } from './index';

/**
 * 상태바 스타일 설정
 */
export async function setStatusBarStyle(style: 'light' | 'dark') {
  if (!isNative) return;

  try {
    await StatusBar.setStyle({
      style: style === 'light' ? Style.Light : Style.Dark,
    });
  } catch (error) {
    console.error('상태바 스타일 설정 실패:', error);
  }
}

/**
 * 상태바 배경색 설정 (Android만)
 */
export async function setStatusBarBackgroundColor(color: string) {
  if (!isNative) return;

  try {
    await StatusBar.setBackgroundColor({ color });
  } catch (error) {
    console.error('상태바 배경색 설정 실패:', error);
  }
}

/**
 * 상태바 표시/숨김
 */
export async function toggleStatusBar(show: boolean) {
  if (!isNative) return;

  try {
    if (show) {
      await StatusBar.show();
    } else {
      await StatusBar.hide();
    }
  } catch (error) {
    console.error('상태바 표시/숨김 실패:', error);
  }
}
