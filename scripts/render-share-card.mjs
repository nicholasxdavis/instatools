import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const html = pathToFileURL(join(root, 'scripts', 'share-card.html')).href
const outDir = join(root, 'public')
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
})
await page.goto(html, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(800)
const card = page.locator('.card')
await card.waitFor({ state: 'visible' })
const og = join(outDir, 'og.png')
const share = join(outDir, 'share.png')
await card.screenshot({ path: og, type: 'png' })
await copyFile(og, share)
await browser.close()
console.log('wrote public/og.png and public/share.png')
