import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA is disabled during active development — stale service workers were causing
// users to see outdated bundles. We also ship a cleanup SW that unregisters any
// previous worker on load.
const ENABLE_PWA = false;

export default defineConfig({
  plugins: [
    react(),
    ...(ENABLE_PWA
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
              name: 'Rajadisainer — Takistussõit',
              short_name: 'Rajad',
              description: 'Takistussõidu rajadisainer treenerile',
              theme_color: '#0f172a',
              background_color: '#0f172a',
              display: 'standalone',
              orientation: 'any',
              icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
              skipWaiting: true,
              clientsClaim: true,
              cleanupOutdatedCaches: true,
            },
          }),
        ]
      : [
          VitePWA({
            selfDestroying: true,
            injectRegister: 'auto',
            registerType: 'autoUpdate',
          }),
        ]),
  ],
  build: { sourcemap: true },
  server: { host: true, port: 5173 },
});
