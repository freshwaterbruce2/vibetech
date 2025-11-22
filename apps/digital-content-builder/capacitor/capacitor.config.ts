import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibetech.digitalcontentbuilder',
  appName: 'Digital Content Builder',
  webDir: '../dist/renderer',
  server: {
    androidScheme: 'https'
  }
};

export default config;
