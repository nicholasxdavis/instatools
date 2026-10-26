import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const apiRoot = fileURLToPath(new URL('.', import.meta.url))
const v2Src = fileURLToPath(new URL('../src', import.meta.url))
const v2Root = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  root: fileURLToPath(new URL('./renderer', import.meta.url)),
  base: '/',
  appType: 'mpa',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': v2Src,
      vue: fileURLToPath(new URL('./node_modules/vue', import.meta.url)),
      pinia: fileURLToPath(new URL('./node_modules/pinia', import.meta.url)),
    },
    dedupe: ['vue', 'pinia'],
  },
  server: {
    port: 8788,
    strictPort: true,
    fs: {
      allow: [apiRoot, v2Root],
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
})
