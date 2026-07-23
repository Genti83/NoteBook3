import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.notebook3.app',
  appName: 'NoteBook3',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
