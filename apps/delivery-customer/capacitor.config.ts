import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourbrand.delivery',
  appName: '우리브랜드 배달',
  webDir: 'out',

  server: {
    // 개발 시 localhost 사용 (선택)
    // url: 'http://localhost:3001',
    // cleartext: true,
  },

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
    allowMixedContent: true,
  },

  ios: {
    contentInset: 'automatic',
  },
};

export default config;
