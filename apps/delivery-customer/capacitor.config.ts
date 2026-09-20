import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;
// CAPACITOR_SERVER_URL이 http://로 시작하면 로컬 개발 환경으로 간주.
// 이 때만 cleartext / allowMixedContent를 허용하고, 운영 빌드(unset 또는 https://...)에서는
// HTTP 리소스/평문 통신을 차단해 MITM 공격면을 줄인다.
const isLocalDevServer = serverUrl?.startsWith('http://') ?? false;

/**
 * 결제 중 앱 웹뷰가 이동할 수 있어야 하는 호스트 목록.
 * 토스 결제창 → 카드사/은행/간편결제/본인인증 순으로 리다이렉트가 이어진다.
 */
const PAYMENT_NAVIGATION_HOSTS = [
  // 토스페이먼츠
  '*.tosspayments.com',
  '*.toss.im',
  '*.tosspay.com',
  // 카드사
  '*.kbcard.com',
  '*.shinhancard.com',
  '*.samsungcard.com',
  '*.hyundaicard.com',
  '*.lottecard.co.kr',
  '*.hanacard.co.kr',
  '*.bccard.com',
  '*.nhcard.com',
  '*.wooricard.com',
  '*.citicard.co.kr',
  '*.kbanknow.com',
  // 간편결제
  '*.kakao.com',
  '*.kakaopay.com',
  '*.naver.com',
  '*.pay.naver.com',
  '*.payco.com',
  '*.samsungpay.com',
  '*.ssg.com',
  // 은행/계좌이체
  '*.kftc.or.kr',
  '*.kbstar.com',
  '*.shinhan.com',
  '*.wooribank.com',
  '*.hanabank.com',
  '*.nonghyup.com',
  '*.ibk.co.kr',
  '*.kakaobank.com',
  '*.tossbank.com',
  // 본인인증/PG 부가
  '*.mobile-ok.com',
  '*.dreamsecurity.com',
  '*.kgmobilians.com',
  '*.danal.co.kr',
  '*.inicis.com',
  '*.nicepay.co.kr',
];

const config: CapacitorConfig = {
  appId: 'com.tacomole.app',
  appName: '타코몰리',
  webDir: 'public',

  // 결제창이 앱 밖으로 튕겨나가지 않도록 결제 관련 도메인을 웹뷰 이동 허용 목록에 둔다.
  // Capacitor는 server.url 외 도메인으로의 최상위 이동을 기본적으로 시스템 브라우저로
  // 넘기는데, 토스 결제창은 선택한 결제수단에 따라 카드사·은행·간편결제 도메인으로
  // 연속 리다이렉트하기 때문에 그대로 두면 결제 도중 앱을 이탈한다.
  //
  // 주의: 여기 없는 도메인으로 리다이렉트하는 결제수단은 여전히 외부 브라우저로 열린다.
  // 그런 결제수단이 발견되면 이 목록에 추가해야 한다.
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: isLocalDevServer,
        allowNavigation: PAYMENT_NAVIGATION_HOSTS,
      }
    : undefined,

  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#000000',
    },
  },

  android: {
    // 운영 빌드(HTTPS 또는 server.url 미설정) 시 false. 로컬 HTTP dev 서버 붙을 때만 true.
    allowMixedContent: isLocalDevServer,
  },

  ios: {
    contentInset: 'automatic',
  },
};

export default config;
