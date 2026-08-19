import { CDN_ORIGIN } from '@/config/media'

const HOLDER_ROOT = `${CDN_ORIGIN}/holder/`
const TEXTURES_ROOT = `${CDN_ORIGIN}/textures/`

/** GitHub blob viewer URLs do not send CORS headers — use raw.githubusercontent.com. */
export function normalizeGithubBlob(src) {
  try {
    const u = new URL(src)
    if (u.hostname === 'github.com') {
      const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+)/)
      if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`
    }
  } catch {
    /* not a URL */
  }
  return src
}

/**
 * Resolve image/video URLs for preview and export.
 * Maps /holder/ and holder/ paths to the public CDN (assets are not in site public/).
 */
export function resolveMediaUrl(src) {
  if (!src || typeof src !== 'string') return ''
  let value = src.trim()
  if (!value) return ''

  if (value.startsWith('data:') || value.startsWith('blob:')) return value
  if (value.startsWith('//')) return `https:${value}`

  value = normalizeGithubBlob(value)

  if (/^https?:\/\//i.test(value)) return value

  if (value.startsWith('src/ui/')) value = `/${value.slice(4)}`
  if (value.startsWith('./src/ui/')) value = `/${value.slice(6)}`

  const holderMatch = value.match(/^(?:\/)?holder\/(.+)$/i)
  if (holderMatch) return `${HOLDER_ROOT}${holderMatch[1]}`

  const texMatch = value.match(/^(?:\/)?textures\/(.+)$/i)
  if (texMatch) return `${TEXTURES_ROOT}${texMatch[1]}`

  if (/^[^/]+\.(jpe?g|png|webp|gif|svg|mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(value)) {
    return `${HOLDER_ROOT}${value}`
  }

  if (value.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return new URL(value, window.location.origin).href
    }
    return value
  }

  return resolveMediaUrl(`/${value}`)
}
