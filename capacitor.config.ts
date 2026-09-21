import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zhirox.daftariqarz',
  appName: 'Daftar Qarz',
  webDir: 'dist',
  backgroundColor: '#000000',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
