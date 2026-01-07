import { PaymentInfo, PaymentResult, PaymentMethod } from './types';
import { platform } from '@/lib/capacitor';
import { openBrowser } from '@/lib/capacitor/browser';

/**
 * 결제 처리
 *
 * NOTE: 실제 구현 시 각 PG사의 SDK를 사용해야 합니다.
 * - 토스페이먼츠: https://docs.tosspayments.com/
 * - 포트원(구 아임포트): https://portone.io/
 * - 나이스페이: https://npay.nicepay.co.kr/
 */
export async function processPayment(
  info: PaymentInfo
): Promise<PaymentResult> {
  try {
    // 결제 방법에 따라 다른 처리
    switch (info.method) {
      case 'CARD':
        return await processCardPayment(info);

      case 'KAKAO_PAY':
        return await processKakaoPayment(info);

      case 'NAVER_PAY':
        return await processNaverPayment(info);

      case 'TOSS':
        return await processTossPayment(info);

      case 'SAMSUNG_PAY':
        return await processSamsungPayment(info);

      case 'PAYCO':
        return await processPaycoPayment(info);

      case 'CASH':
        return await processCashPayment(info);

      default:
        throw new Error('지원하지 않는 결제 수단입니다');
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '결제에 실패했습니다',
    };
  }
}

/**
 * 카드 결제 (토스페이먼츠 예시)
 */
async function processCardPayment(
  info: PaymentInfo
): Promise<PaymentResult> {
  // TODO: 토스페이먼츠 SDK 연동
  // https://docs.tosspayments.com/guides/payment-widget/integration

  if (platform.isNative) {
    // 앱: 인앱 브라우저로 결제 페이지 열기
    const paymentUrl = `/payment/card?orderId=${info.orderId}&amount=${info.amount}`;
    await openBrowser(paymentUrl);

    // 결제 결과는 콜백으로 받음
    return { success: true };
  } else {
    // 웹: 결제 위젯 표시
    // const tossPayments = await loadTossPayments('CLIENT_KEY');
    // await tossPayments.requestPayment(...)

    return { success: true };
  }
}

/**
 * 카카오페이
 */
async function processKakaoPayment(
  info: PaymentInfo
): Promise<PaymentResult> {
  // TODO: 카카오페이 SDK 연동
  // https://developers.kakao.com/docs/latest/ko/kakaopay/common

  return {
    success: true,
    message: '카카오페이 결제가 완료되었습니다',
  };
}

/**
 * 네이버페이
 */
async function processNaverPayment(
  info: PaymentInfo
): Promise<PaymentResult> {
  // TODO: 네이버페이 SDK 연동
  // https://developer.pay.naver.com/docs/v2/api

  return {
    success: true,
    message: '네이버페이 결제가 완료되었습니다',
  };
}

/**
 * 토스
 */
async function processTossPayment(
  info: PaymentInfo
): Promise<PaymentResult> {
  // TODO: 토스 간편결제 연동

  return {
    success: true,
    message: '토스 결제가 완료되었습니다',
  };
}

/**
 * 삼성페이
 */
async function processSamsungPayment(
  info: PaymentInfo
): Promise<PaymentResult> {
  // TODO: 삼성페이 SDK 연동

  return {
    success: true,
    message: '삼성페이 결제가 완료되었습니다',
  };
}

/**
 * 페이코
 */
async function processPaycoPayment(
  info: PaymentInfo
): Promise<PaymentResult> {
  // TODO: 페이코 SDK 연동

  return {
    success: true,
    message: '페이코 결제가 완료되었습니다',
  };
}

/**
 * 현금 결제 (만나서 결제)
 */
async function processCashPayment(
  info: PaymentInfo
): Promise<PaymentResult> {
  // 현금 결제는 서버에 주문만 생성
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...info,
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
    }),
  });

  if (response.ok) {
    return {
      success: true,
      message: '주문이 접수되었습니다. 만나서 결제해주세요.',
    };
  } else {
    throw new Error('주문 생성에 실패했습니다');
  }
}

/**
 * 결제 취소/환불
 */
export async function refundPayment(
  transactionId: string,
  amount: number
): Promise<PaymentResult> {
  try {
    const response = await fetch('/api/payment/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, amount }),
    });

    if (response.ok) {
      return {
        success: true,
        message: '환불이 완료되었습니다',
      };
    } else {
      throw new Error('환불에 실패했습니다');
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '환불에 실패했습니다',
    };
  }
}
