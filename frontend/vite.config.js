// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      devOptions: {
        enabled: false, // ✅ disables service worker in dev
      },
      manifest: {
        name: 'ZAPALERT!',
        short_name: 'ZAPALERT',
        description: 'Disaster Reporting & Response App for Zapatera',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/zapalert-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/zapalert-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
