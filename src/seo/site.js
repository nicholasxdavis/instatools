export const SITE = {
  name: 'Instatools',
  shortName: 'Instatools',
  origin: 'https://www.useinstatools.com',
  locale: 'en_US',
  language: 'en',
  themeColor: '#1a1a1a',
  backgroundColor: '#1a1a1a',
  twitter: '',
  sameAs: [
    'https://buymeacoffee.com/galore',
    'https://github.com/nicholasxdavis/instatools',
  ],
  ogImage: {
    path: '/og.png',
    sharePath: '/share.png',
    width: 1200,
    height: 630,
    alt: 'Instatools free Instagram post maker with ready-to-edit layouts on a light marketing canvas',
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
