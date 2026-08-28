import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/meal-planner/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Familien-Essensplaner',
        short_name: 'Essensplaner',
        lang: 'de',
        start_url: '/meal-planner/',
        scope: '/meal-planner/',
        display: 'standalone',
        // iOS fills the status bar strip above the web view with this. Must stay identical
        // to the top fade colour in index.css, or that seam becomes visible again.
        background_color: '#f4dac3',
        theme_color: '#6f8b5f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
