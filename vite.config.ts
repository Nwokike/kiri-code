import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [tailwindcss(), react(), nodePolyfills({
    include: ['buffer', 'crypto', 'stream', 'util'],
    globals: {
      Buffer: true,
      global: true,
      process: true,
    },
  }), VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
      maximumFileSizeToCacheInBytes: 15000000, 
    },
    manifest: {
      name: 'Kiri Code',
      short_name: 'code.kiri.ng',
      description: 'Serverless AI IDE',
      theme_color: '#1e1e1e',
      background_color: '#1e1e1e',
      display: 'standalone',
      icons: [
        {
          src: 'logo.webp',
          sizes: 'any',
          type: 'image/webp'
        }
      ]
    }
  }), cloudflare()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    exclude: ['@webcontainer/api'],
  },
})