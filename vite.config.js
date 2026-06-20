import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'

const SCRAPPER_TARGET =
  'https://scrapper-linkbox-store-93100653399.asia-south1.run.app'

const LINKPREVIEW_TARGET = 'https://api.linkpreview.net'

const scraperProxy = {
  '/api/scrapper': {
    target: SCRAPPER_TARGET,
    changeOrigin: true,
    rewrite: p => p.replace(/^\/api\/scrapper/, ''),
  },
  '/api/linkpreview': {
    target: LINKPREVIEW_TARGET,
    changeOrigin: true,
    rewrite: p => p.replace(/^\/api\/linkpreview/, ''),
  },
}

export default defineConfig({
  appType: 'spa',

  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    proxy: scraperProxy,
  },

  preview: {
    proxy: scraperProxy,
  },
})