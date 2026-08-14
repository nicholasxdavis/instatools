import { SITE, absoluteUrl } from './site'
import { jsonLdForPage } from './catalog'

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === '') el.removeAttribute(key)
    else el.setAttribute(key, value)
  }
  return el
}

function upsertLink(rel, href, extra = {}) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
  for (const [key, value] of Object.entries(extra)) {
    if (value == null) el.removeAttribute(key)
    else el.setAttribute(key, value)
  }
  return el
}

export function applySeo(page) {
  if (typeof document === 'undefined' || !page) return

  const url = absoluteUrl(page.path === '/404' ? '/' : page.path)
  const image = absoluteUrl(SITE.ogImage.path)
  const robots = page.robots || 'index,follow'

  document.title = page.title
  document.documentElement.lang = SITE.language

  upsertMeta('meta[name="description"]', { name: 'description', content: page.description })
  upsertMeta('meta[name="robots"]', { name: 'robots', content: robots })
  upsertMeta('meta[name="googlebot"]', { name: 'googlebot', content: robots })
  upsertMeta('meta[name="keywords"]', { name: 'keywords', content: page.keywords || '' })
  upsertMeta('meta[name="author"]', { name: 'author', content: SITE.name })
  upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: SITE.themeColor })
  upsertMeta('meta[name="color-scheme"]', { name: 'color-scheme', content: 'dark light' })
  upsertMeta('meta[name="application-name"]', { name: 'application-name', content: SITE.name })
  upsertMeta('meta[name="apple-mobile-web-app-title"]', {
    name: 'apple-mobile-web-app-title',
    content: SITE.name,
  })
  upsertMeta('meta[name="apple-mobile-web-app-capable"]', {
    name: 'apple-mobile-web-app-capable',
    content: 'yes',
  })
  upsertMeta('meta[name="mobile-web-app-capable"]', {
    name: 'mobile-web-app-capable',
    content: 'yes',
  })
  upsertMeta('meta[name="apple-mobile-web-app-status-bar-style"]', {
    name: 'apple-mobile-web-app-status-bar-style',
    content: 'black-translucent',
  })

  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE.name })
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: SITE.locale })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: page.title })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: page.description })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image })
  upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: SITE.ogImage.alt })
  upsertMeta('meta[property="og:image:type"]', { property: 'og:image:type', content: SITE.ogImage.type })
  upsertMeta('meta[property="og:image:width"]', {
    property: 'og:image:width',
    content: String(SITE.ogImage.width),
  })
  upsertMeta('meta[property="og:image:height"]', {
    property: 'og:image:height',
    content: String(SITE.ogImage.height),
  })

  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: page.title })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: page.description })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image })
  upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: SITE.ogImage.alt })

  upsertLink('canonical', url)
  upsertLink('manifest', '/site.webmanifest')

  let json = document.getElementById('ld-json')
  if (!json) {
    json = document.createElement('script')
    json.type = 'application/ld+json'
    json.id = 'ld-json'
    document.head.appendChild(json)
  }
  json.textContent = JSON.stringify(jsonLdForPage(page))
}
