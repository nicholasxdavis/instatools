export const SITE = {
  name: 'Instatools',
  shortName: 'Instatools',
  origin: 'https://www.useinstatools.com',
  locale: 'en_US',
  language: 'en',
  themeColor: '#1a1a1a',
  backgroundColor: '#1a1a1a',
  twitter: '',
  googleSiteVerification: '',
  sameAs: [
    'https://buymeacoffee.com/galore',
    'https://github.com/nicholasxdavis/instatools',
    'https://www.producthunt.com/products/instatools-for-instagram-posts',
  ],
  ogImage: {
    path: '/og.png',
    sharePath: '/share.png',
    width: 1200,
    height: 630,
    alt: 'Instatools free Instagram post maker editing a layout headline in the browser',
    type: 'image/png',
  },
}

export function absoluteUrl(path = '/') {
  const origin = SITE.origin.replace(/\/$/, '')
  if (!path || path === '/') return `${origin}/`
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (/\.[a-z0-9]+$/i.test(normalized)) return `${origin}${normalized}`
  return `${origin}${normalized.endsWith('/') ? normalized : `${normalized}/`}`
}
