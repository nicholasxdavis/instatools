import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const githubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: githubPages ? '/instatools/' : '/',
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
