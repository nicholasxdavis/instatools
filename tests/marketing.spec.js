import { expect, test } from '@playwright/test'

function size(box) {
  return { w: Math.round(box.width), h: Math.round(box.height) }
}

test.describe('marketing chrome', () => {
  test('desktop nav matches on homepage and docs', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const home = await page.locator('.m-nav-center a').allTextContents()
    expect(home).toEqual(['Layouts', 'API', 'FAQ', 'Docs', 'Pricing'])
    await page.goto('/docs')
    const docs = await page.locator('.m-nav-center a').allTextContents()
    expect(docs).toEqual(home)
    await page.goto('/pricing')
    expect(await page.locator('.m-nav-center a').allTextContents()).toEqual(home)
  })

  test('Try now and Browse layouts are the same size', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const buttons = page.locator('.m-hero-actions .m-hero-btn')
    await expect(buttons).toHaveCount(2)
    const a = size(await buttons.nth(0).boundingBox())
    const b = size(await buttons.nth(1).boundingBox())
    expect(a).toEqual(b)
  })

  test('API band buttons are the same size', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const buttons = page.locator('.m-api-actions .m-hero-btn')
    await expect(buttons).toHaveCount(3)
    const first = size(await buttons.nth(0).boundingBox())
    for (let i = 1; i < 3; i += 1) {
      expect(size(await buttons.nth(i).boundingBox())).toEqual(first)
    }
    const api = await page.locator('.m-api-shell').boundingBox()
    const templates = await page.locator('.m-templates-shell').boundingBox()
    expect(Math.round(api.width)).toBe(Math.round(templates.width))
  })

  test('mobile Try now stays inside the nav', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const nav = await page.locator('.m-nav').boundingBox()
    const btn = await page.locator('.m-nav .btn-try').boundingBox()
    expect(nav).toBeTruthy()
    expect(btn).toBeTruthy()
    expect(btn.x + btn.width).toBeLessThanOrEqual(nav.x + nav.width + 1)
    expect(btn.y).toBeGreaterThanOrEqual(nav.y - 1)
    const links = await page.locator('.m-nav-mobile-api a').allTextContents()
    expect(links).toEqual(['Layouts', 'API', 'FAQ', 'Docs', 'Pricing', 'Account'])
  })

  test('tool header has legal links and API', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/make')
    await expect(page.locator('.tool-nav a')).toContainText(['Layouts', 'Privacy', 'Terms'])
    await expect(page.locator('.api-link')).toHaveText('API')
  })
})
