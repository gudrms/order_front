import { Share } from '@capacitor/share';
import { isNative } from './index';

/**
 * 공유하기
 */
export async function share(options: {
  title?: string;
  text?: string;
  url?: string;
}) {
  if (!isNative) {
    // 웹에서는 Web Share API 사용
    if (navigator.share) {
      try {
        await navigator.share(options);
      } catch (error) {
        console.error('공유 실패:', error);
      }
    } else {
      console.warn('이 브라우저는 공유 기능을 지원하지 않습니다.');
    }
    return;
  }

  try {
    await Share.share(options);
  } catch (error) {
    console.error('공유 실패:', error);
  }
}

/**
 * 앱 공유 (친구 추천)
 */
export async function shareApp() {
  await share({
    title: '우리브랜드 배달 앱',
    text: '우리브랜드에서 주문하세요! 빠르고 맛있어요 🍕',
    url: 'https://yourbrand.com/download',
  });
}

/**
 * 주문 공유
 */
export async function shareOrder(orderNumber: string) {
  await share({
    title: '주문 완료!',
    text: `주문번호 ${orderNumber}로 주문했어요!`,
  });
}
