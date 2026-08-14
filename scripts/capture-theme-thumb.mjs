import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const slug = process.argv[2] || 'hazard'
const id = process.argv[3] || 'template14'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'themes')
await mkdir(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } })
await page.goto(`http://127.0.0.1:5173/themes/${slug}/`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(2500)
const artboard = page.locator('.artboard')
await artboard.waitFor({ state: 'visible' })
await artboard.screenshot({ path: join(out, `${id}.png`), type: 'png' })
await browser.close()
console.log(`wrote public/themes/${id}.png`)
