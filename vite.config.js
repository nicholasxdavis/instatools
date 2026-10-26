import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { cpSync, createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

const deployTarget = process.env.DEPLOY_TARGET || 'root'
const base = deployTarget === 'github-pages' ? '/instatools/' : '/'
const rootDir = fileURLToPath(new URL('.', import.meta.url))
const docsDir = join(rootDir, 'docs')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
}

function isInside(root, file) {
  const rel = relative(root, file)
  return Boolean(rel) && !rel.startsWith('..') && !rel.includes(`..${sep}`)
}

function serveDocsFile(url, res, next) {
  const path = url.split('?')[0]
  if (path !== '/docs' && !path.startsWith('/docs/')) return next()
  const rel = path === '/docs' || path === '/docs/' ? 'index.html' : decodeURIComponent(path.slice('/docs/'.length))
  const file = resolve(docsDir, rel)
  if (!isInside(docsDir, file)) return next()
  if (!existsSync(file) || statSync(file).isDirectory()) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    createReadStream(join(docsDir, 'index.html')).pipe(res)
    return
  }
  res.statusCode = 200
  res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream')
  createReadStream(file).pipe(res)
}

function docsPlugin() {
  return {
    name: 'instatools-docs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => serveDocsFile(req.url || '', res, next))
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => serveDocsFile(req.url || '', res, next))
    },
    writeBundle() {
      cpSync(docsDir, join(rootDir, 'dist', 'docs'), { recursive: true })
    },
  }
}

export default defineConfig({
  base,
  appType: 'spa',
  plugins: [vue(), docsPlugin()],
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
