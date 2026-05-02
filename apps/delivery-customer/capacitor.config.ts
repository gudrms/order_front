import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.taco.delivery',
  appName: '타코 배달',
  webDir: 'public',

  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith('http://'),
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
    allowMixedContent: true,
  },

  ios: {
    contentInset: 'automatic',
  },
};

export default config;
