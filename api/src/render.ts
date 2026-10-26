import puppeteer from '@cloudflare/puppeteer'
import type { CatalogTemplate, DesignPost } from './catalog'
import { HttpError } from './http'

function rendererOrigin(request: Request, env: Env) {
  const configured = env.RENDER_ORIGIN?.trim()
  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      throw new HttpError(500, 'bad_config', 'RENDER_ORIGIN is not a valid URL.')
    }
  }
  return new URL(request.url).origin
}

function toBytes(value: unknown) {
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  throw new HttpError(500, 'render_failed', 'Renderer returned an unexpected image payload.')
}

export async function renderPng(env: Env, request: Request, post: DesignPost, template: CatalogTemplate) {
  const origin = rendererOrigin(request, env)
  const browser = await puppeteer.launch(env.BROWSER)
  try {
    const page = await browser.newPage()
    await page.setViewport({
      width: template.size.width,
      height: template.size.height,
      deviceScaleFactor: 1,
    })
    await page.goto(`${origin}/render`, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.waitForFunction('typeof globalThis.__INSTATOOLS_APPLY === "function"', { timeout: 20_000 })
    await page.evaluate(async (design) => {
      const apply = (globalThis as unknown as { __INSTATOOLS_APPLY?: (next: unknown) => Promise<unknown> }).__INSTATOOLS_APPLY
      if (typeof apply !== 'function') throw new Error('Renderer apply is missing')
      await apply(design)
    }, post)
    await page.waitForFunction('document.documentElement.dataset.ready === "1"', { timeout: 25_000 })
    const artboard = await page.$('[data-instatools-artboard]')
    if (!artboard) {
      throw new HttpError(500, 'render_failed', 'Renderer artboard was not found.')
    }
    return toBytes(await artboard.screenshot({ type: 'png' }))
  } catch (error) {
    if (error instanceof HttpError) throw error
    console.error(error)
    throw new HttpError(500, 'render_failed', 'Could not render PNG.')
  } finally {
    await browser.close()
  }
}

export function pngResponse(
  bytes: Uint8Array,
  template: CatalogTemplate,
  designId?: string,
  usage?: { renders: number },
) {
  const headers = new Headers({
    'content-type': 'image/png',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-instatools-template': template.id,
    'x-instatools-width': String(template.size.width),
    'x-instatools-height': String(template.size.height),
  })
  if (designId) headers.set('x-instatools-design', designId)
  if (usage) headers.set('x-instatools-renders-used', String(usage.renders))
  return new Response(bytes, { status: 200, headers })
}
