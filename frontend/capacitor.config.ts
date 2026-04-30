import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.righttothesource.app',
  appName: 'Right to the Source',
  webDir: 'build',
  backgroundColor: '#f6f1e8',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 400,
      showSpinner: false,
      backgroundColor: '#f6f1e8',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#f6f1e8',
      overlaysWebView: false,
    },
  },
};

export default config;
