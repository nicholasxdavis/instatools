import { expect, test } from '@playwright/test'
import { HOME_PAGE, INDEXABLE_PAGES, THEME_PAGES } from '../src/seo/catalog.js'
import { SITE, absoluteUrl } from '../src/seo/site.js'

function meta(page, name) {
  return page.locator(`meta[name="${name}"]`).getAttribute('content')
}

function property(page, name) {
  return page.locator(`meta[property="${name}"]`).getAttribute('content')
}

test.describe('catalog quality', () => {
  for (const page of INDEXABLE_PAGES) {
    test(`${page.path} title and description stay in range`, () => {
      expect(page.title.length).toBeGreaterThanOrEqual(15)
      expect(page.title.length).toBeLessThanOrEqual(60)
      expect(page.description.length).toBeGreaterThanOrEqual(110)
      expect(page.description.length).toBeLessThanOrEqual(165)
      expect(page.title).toContain('Instatools')
      expect(page.h1.length).toBeGreaterThan(3)
    })
  }

  test('theme slugs are unique', () => {
    const slugs = THEME_PAGES.map((page) => page.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

test.describe('static documents', () => {
  test('robots.txt allows indexing and points at the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.ok()).toBeTruthy()
    const body = await response.text()
    expect(body).toContain('User-agent: *')
    expect(body).toContain('Disallow: /404')
    expect(body).toContain('Disallow: /app')
    expect(body).toContain(`Sitemap: ${absoluteUrl('/sitemap.xml')}`)
  })

  test('sitemap lists every indexable url once', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()
    const xml = await response.text()
    expect(xml).toContain('<?xml')
    for (const page of INDEXABLE_PAGES) {
      const loc = `<loc>${absoluteUrl(page.path)}</loc>`
      expect(xml).toContain(loc)
      expect(xml.split(loc).length - 1).toBe(1)
    }
  })

  test('web manifest is valid JSON', async ({ request }) => {
    const response = await request.get('/site.webmanifest')
    expect(response.ok()).toBeTruthy()
    const manifest = await response.json()
    expect(manifest.name).toBe(SITE.name)
    expect(manifest.start_url).toBe('/')
    expect(manifest.icons.length).toBeGreaterThan(0)
  })
})

test.describe('rendered pages', () => {
  for (const record of INDEXABLE_PAGES) {
    test(`${record.path} exposes complete SEO tags`, async ({ page }) => {
      const response = await page.goto(record.path, { waitUntil: 'domcontentloaded' })
      expect(response?.ok()).toBeTruthy()
      await expect(page).toHaveTitle(record.title)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      expect(await meta(page, 'description')).toBe(record.description)
      expect(await meta(page, 'robots')).toMatch(/index/)
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(absoluteUrl(record.path))
      expect(await property(page, 'og:title')).toBe(record.title)
      expect(await property(page, 'og:description')).toBe(record.description)
      expect(await property(page, 'og:url')).toBe(absoluteUrl(record.path))
      expect(await property(page, 'og:image')).toBe(absoluteUrl(SITE.ogImage.path))
      expect(await meta(page, 'twitter:card')).toBe('summary_large_image')
      expect(await meta(page, 'twitter:title')).toBe(record.title)

      const json = JSON.parse(await page.locator('#ld-json').textContent())
      expect(json['@context']).toBe('https://schema.org')
      expect(Array.isArray(json['@graph'])).toBeTruthy()
      expect(json['@graph'].some((node) => node['@type'] === 'Organization')).toBeTruthy()

      const heading = page.locator('#marketing-title, .workspace h1, .missing h1')
      await expect(heading).toHaveCount(1)
      await expect(heading).toHaveText(record.h1)
      if (record.id === 'home') {
        await expect(page.getByRole('link', { name: 'Try now' }).first()).toHaveAttribute('href', '/app')
        const jsonHome = JSON.parse(await page.locator('#ld-json').textContent())
        expect(jsonHome['@graph'].some((node) => node['@type'] === 'FAQPage')).toBeTruthy()
        await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible()
      } else {
        await expect(page.locator('.skip-link')).toHaveAttribute('href', '#workspace')
      }
    })
  }

  test('home theme picker exposes crawlable theme links', async ({ page }) => {
    await page.goto('/app')
    await page.getByRole('tab', { name: 'Themes' }).click()
    const links = page.locator('nav[aria-label="Instagram post themes"] a')
    await expect(links).toHaveCount(THEME_PAGES.length)
    for (const theme of THEME_PAGES) {
      const hrefs = [theme.path, theme.path.replace(/\/$/, '')]
      await expect(page.locator(hrefs.map((href) => `a[href="${href}"]`).join(', '))).toBeVisible()
    }
  })

  test('marketing home lists every layout', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('#templates a.m-card')
    await expect(cards).toHaveCount(THEME_PAGES.length)
    for (const theme of THEME_PAGES) {
      const hrefs = [theme.path, theme.path.replace(/\/$/, '')]
      await expect(page.locator(hrefs.map((href) => `#templates a[href="${href}"]`).join(', '))).toBeVisible()
    }
  })

  test('theme route loads that theme and updates the document title', async ({ page }) => {
    const theme = THEME_PAGES[4]
    await page.goto(theme.path)
    await expect(page).toHaveTitle(theme.title)
    await page.getByRole('tab', { name: 'Themes' }).click()
    const hrefs = [theme.path, theme.path.replace(/\/$/, '')]
    await expect(page.locator(hrefs.map((href) => `a[href="${href}"]`).join(', '))).toHaveAttribute('aria-current', 'page')
  })

  test('unknown routes are noindexed', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle('Page not found | Instatools')
    expect(await meta(page, 'robots')).toMatch(/noindex/)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Try now' })).toBeVisible()
  })

  test('images have accessible names', async ({ page }) => {
    await page.goto('/')
    const images = page.locator('img')
    const count = await images.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i += 1) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt, `img ${i} missing alt`).not.toBeNull()
    }
  })
})
