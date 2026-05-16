import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;
// CAPACITOR_SERVER_URL이 http://로 시작하면 로컬 개발 환경으로 간주.
// 이 때만 cleartext / allowMixedContent를 허용하고, 운영 빌드(unset 또는 https://...)에서는
// HTTP 리소스/평문 통신을 차단해 MITM 공격면을 줄인다.
const isLocalDevServer = serverUrl?.startsWith('http://') ?? false;

const config: CapacitorConfig = {
  appId: 'com.tacomole.app',
  appName: '타코 배달',
  webDir: 'public',

  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: isLocalDevServer,
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
