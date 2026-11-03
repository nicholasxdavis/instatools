import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'themes')
await mkdir(out, { recursive: true })

const themes = [
  ['award-week', 'template18'],
  ['breaking-slash', 'template19'],
  ['scoreline', 'template20'],
  ['impact', 'template21'],
  ['trending', 'template22'],
  ['world-tape', 'template23'],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } })

for (const [slug, id] of themes) {
  await page.goto(`http://localhost:5173/themes/${slug}/`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.evaluate(() => {
    try {
      localStorage.removeItem('instatools_editor_draft_v1')
    } catch {}
  })
  await page.reload({ waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(2800)
  const artboard = page.locator('.artboard')
  await artboard.waitFor({ state: 'visible', timeout: 30000 })
  await artboard.screenshot({ path: join(out, `${id}.png`), type: 'png' })
  console.log(`wrote public/themes/${id}.png`)
}

await browser.close()
console.log('done')
