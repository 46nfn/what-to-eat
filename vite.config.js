import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      // 自动生成 Service Worker（workbox）
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff2}'],
        runtimeCaching: [
          // API 请求 — Network First
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 图片缓存 — Cache First
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 },
            },
          },
          // 字体缓存 — Cache First
          {
            urlPattern: /\.(?:woff2?|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: '这顿吃什么 - 美食决策轻社区',
        short_name: '这顿吃什么',
        description: '美食记录、AI推荐、社区分享 — 今天吃什么不再纠结',
        theme_color: '#F5D5A0',
        background_color: '#FFFAF5',
        display: 'standalone',
        orientation: 'any',
        start_url: './index.html',
        scope: './',
        lang: 'zh-CN',
        icons: [
          { src: './icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: './icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: './icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: './icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: './icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: './icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: './icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: './icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: './icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  base: './',
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: { outDir: 'dist', assetsDir: 'assets' },
})
