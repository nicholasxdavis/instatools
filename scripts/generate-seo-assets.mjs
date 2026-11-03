import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
await mkdir(publicDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()

// og.png / share.png come from `npm run share` (scripts/share-card.html). Do not overwrite here.

const favicon = pathToFileURL(join(publicDir, 'favicon.svg')).href
async function raster(size, file, pad = 0.18) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`
    <html><body style="margin:0;background:#1a1a1a">
      <div style="width:${size}px;height:${size}px;display:grid;place-items:center">
        <img src="${favicon}" width="${Math.round(size * (1 - pad * 2))}" height="${Math.round(size * (1 - pad * 2))}" alt="" />
      </div>
    </body></html>
  `)
  await page.screenshot({ path: join(publicDir, file), type: 'png' })
}

await raster(32, 'favicon-32.png', 0.08)
await raster(180, 'apple-touch-icon.png')
await raster(192, 'icon-192.png')
await raster(512, 'icon-512.png', 0.12)
await raster(32, 'favicon.png', 0.08)

await browser.close()
console.log('wrote og.png, favicon pngs, apple-touch-icon, and PWA icons')
