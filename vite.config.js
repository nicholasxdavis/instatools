import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const deployTarget = process.env.DEPLOY_TARGET || 'root'
const base = deployTarget === 'github-pages' ? '/instatools/' : '/'

export default defineConfig({
  base,
  appType: 'spa',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
