import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'audits')
const port = 4173
const url = `http://127.0.0.1:${port}/`

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForPreview() {
  const started = Date.now()
  while (Date.now() - started < 30000) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      /* retry */
    }
    await sleep(400)
  }
  throw new Error('Preview server did not start')
}

let preview
try {
  const existing = await fetch(url)
  if (!existing.ok) throw new Error('preview not ready')
  console.log('using existing preview server')
} catch {
  preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  await waitForPreview()
}

let chrome
try {
  chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  })
  const result = await lighthouse(url, {
    port: chrome.port,
    output: ['json', 'html'],
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  })

  await mkdir(outDir, { recursive: true })
  const reports = Array.isArray(result.report) ? result.report : [result.report]
  await writeFile(join(outDir, 'lighthouse.json'), reports[0])
  if (reports[1]) await writeFile(join(outDir, 'lighthouse.html'), reports[1])

  const scores = Object.fromEntries(
    Object.entries(result.lhr.categories).map(([key, cat]) => [key, Math.round((cat.score || 0) * 100)]),
  )
  console.log('Lighthouse scores', scores)

  const seoRefs = new Set(result.lhr.categories.seo.auditRefs.map((ref) => ref.id))
  const seoFails = Object.values(result.lhr.audits).filter(
    (audit) => seoRefs.has(audit.id) && audit.score !== null && audit.score < 1,
  )
  if (seoFails.length) {
    console.log('SEO audits not passing:')
    for (const audit of seoFails) console.log(`- ${audit.id}: ${audit.title}`)
  } else {
    console.log('All SEO audits passed')
  }

  const a11yRefs = new Set(result.lhr.categories.accessibility.auditRefs.map((ref) => ref.id))
  const a11yFails = Object.values(result.lhr.audits).filter(
    (audit) => a11yRefs.has(audit.id) && audit.score !== null && audit.score < 1,
  )
  if (a11yFails.length) {
    console.log('Accessibility audits not passing:')
    for (const audit of a11yFails) console.log(`- ${audit.id}: ${audit.title}`)
  }

  if (scores.seo < 100) {
    console.error(`SEO score ${scores.seo} is below 100`)
    process.exitCode = 1
  }
  if (scores.accessibility < 85) {
    console.error(`Accessibility score ${scores.accessibility} is below 85`)
    process.exitCode = 1
  }
} finally {
  if (chrome) await chrome.kill()
  preview?.kill()
}
