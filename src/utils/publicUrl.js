/** Prefix a public/ asset path with the Vite base (needed for GitHub Pages). */
export function publicUrl(path = '') {
  const base = import.meta.env.BASE_URL || '/'
  const clean = String(path || '').replace(/^\/+/, '')
  if (!clean) return base
  return `${base}${clean}`
}
