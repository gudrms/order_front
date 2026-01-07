import { Browser } from '@capacitor/browser';
import { isNative } from './index';

/**
 * 인앱 브라우저로 URL 열기
 */
export async function openBrowser(url: string) {
  if (!isNative) {
    // 웹에서는 새 탭으로 열기
    window.open(url, '_blank');
    return;
  }

  try {
    await Browser.open({ url });
  } catch (error) {
    console.error('브라우저 열기 실패:', error);
  }
}

/**
 * 인앱 브라우저 닫기
 */
export async function closeBrowser() {
  if (!isNative) return;

  try {
    await Browser.close();
  } catch (error) {
    console.error('브라우저 닫기 실패:', error);
  }
}

/**
 * 이용약관 열기
 */
export async function openTerms() {
  await openBrowser('https://yourbrand.com/terms');
}

/**
 * 개인정보처리방침 열기
 */
export async function openPrivacyPolicy() {
  await openBrowser('https://yourbrand.com/privacy');
}

/**
 * 고객센터 열기
 */
export async function openSupport() {
  await openBrowser('https://yourbrand.com/support');
}
