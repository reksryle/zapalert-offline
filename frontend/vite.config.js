import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Configuration for Vite build tool
export default defineConfig({
  plugins: [
    // Enables React support
    react(),
    
    // Makes the app installable as a mobile app (PWA)
    VitePWA({
      registerType: 'autoUpdate',     // Auto-update when new version available
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // Files to cache
      devOptions: {
        enabled: false, // Turn off in development to avoid caching issues
      },
      manifest: {
        name: 'ZAPALERT!',           // App name
        short_name: 'ZAPALERT',      // Short name for home screen
        description: 'Disaster Reporting & Response App for Zapatera',
        theme_color: '#ffffff',      // Toolbar color
        display: 'standalone',       // App-like experience (no browser UI)
        start_url: '/',              // Open this page when app launches
        icons: [
          {
            src: '/icons/zapalert-icon-192.png',
            sizes: '192x192',        // Small icon for mobile devices
            type: 'image/png',
          },
          {
            src: '/icons/zapalert-icon-512.png',
            sizes: '512x512',        // Large icon for tablets/desktop
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});