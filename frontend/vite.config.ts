/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // icons and the favicon are listed in the manifest or index.html; sounds and fonts come from `globPatterns`
      includeAssets: ['pigeon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'WrongWayio',
        short_name: 'WrongWayio',
        description: 'Learn left from right with minigames.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#ffffff',
        background_color: '#111827',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // app shell + everything in public that the app plays or renders offline
        globPatterns: ['**/*.{js,css,html,svg,png,ttf,woff2,wav,mp3}'],
        // the shell serves every route, so a gift link opened offline still loads
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
  },
})
