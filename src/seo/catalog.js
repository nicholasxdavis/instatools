import { SITE, absoluteUrl } from './site.js'

const HOME_DESCRIPTION =
  'Free Instagram post maker with 16 ready layouts. Edit photos and headlines in your browser, then export HD 1080x1350 PNG locally. No signup.'

export const HOME_FAQS = [
  {
    question: 'Is Instatools free?',
    answer:
      'Yes. Instatools is a free Instagram post maker. Open a layout, edit your post, and export HD PNG with no signup and no paywall.',
  },
  {
    question: 'Do my photos leave my device?',
    answer:
      'No. Editing and export run in your browser. Your images stay on your device and are not uploaded to Instatools servers.',
  },
  {
    question: 'What size do Instagram posts export at?',
    answer:
      'Most layouts export at 1080x1350 for Instagram feed posts. The tweet layout exports at 1080x1080 square.',
  },
  {
    question: 'How do I start?',
    answer:
      'Click Try now to open the maker, or pick a layout on this page to jump straight into that Instagram post design.',
  },
]

export const THEME_CATALOG = [
  {
    id: 'template1',
    slug: 'news-classic',
    name: 'News (Classic)',
    title: 'Breaking News Instagram Post Maker | Instatools',
    h1: 'Make Breaking News Instagram Posts',
    description:
      'Create bold news-style Instagram posts with giant headlines and captions. Free online maker. Export HD 1080x1350 PNG for meme and news pages.',
    keywords:
      'breaking news Instagram post, news Instagram post maker, Instagram news graphic, free Instagram post maker',
  },
  {
    id: 'template2',
    slug: 'clean-no-jumper',
    name: 'Clean (No Jumper)',
    title: 'Interview Instagram Post Maker | Instatools',
    h1: 'Make Interview Style Instagram Posts',
    description:
      'Design clean interview Instagram posts with a headline bar over your photo. Free for rap and media pages. Edit text, add a watermark, export locally.',
    keywords:
      'interview Instagram post, rap Instagram post maker, podcast Instagram graphic, free Instagram post maker',
  },
  {
    id: 'template3',
    slug: 'wealth-split',
    name: 'Wealth (Split)',
    title: 'Finance Instagram Post Maker | Instatools',
    h1: 'Make Finance Instagram Posts',
    description:
      'Build money and luxury Instagram posts with a photo-plus-headline split. Free online tool for finance pages. Export sharp 1080x1350 graphics on your device.',
    keywords:
      'finance Instagram post, wealth Instagram post maker, money Instagram graphic, luxury Instagram posts',
  },
  {
    id: 'template4',
    slug: 'magazine-xxl',
    name: 'Magazine (XXL)',
    title: 'Magazine Cover Instagram Maker | Instatools',
    h1: 'Make Magazine Cover Instagram Posts',
    description:
      'Turn photos into magazine-cover Instagram posts with oversized type. Free cover-style layouts. Export pixel-perfect PNG right in your browser.',
    keywords:
      'magazine cover Instagram, Instagram cover maker, magazine style Instagram post, free Instagram post maker',
  },
  {
    id: 'template5',
    slug: 'dual-image',
    name: 'Dual Image',
    title: 'Side by Side Instagram Post Maker | Instatools',
    h1: 'Make Side by Side Instagram Posts',
    description:
      'Compare two photos on one Instagram post with a bold stacked headline. Free dual-image layouts. Export locally as 1080x1350 PNG.',
    keywords:
      'side by side Instagram post, dual photo Instagram, compare Instagram post, free Instagram post maker',
  },
  {
    id: 'template6',
    slug: 'sports-hurdels',
    name: 'Sports (Hurdels)',
    title: 'Sports News Instagram Post Maker | Instatools',
    h1: 'Make Sports News Instagram Posts',
    description:
      'Create sports Instagram posts with giant headlines and action photos. Free for game-day and locker-room pages. Export HD graphics from your browser.',
    keywords:
      'sports Instagram post maker, sports news Instagram graphic, NFL Instagram post, free Instagram sports graphic',
  },
  {
    id: 'template7',
    slug: 'twitter-x-post',
    name: 'Twitter/X Post',
    title: 'Tweet to Instagram Post Maker | Instatools',
    h1: 'Turn Tweets into Instagram Posts',
    description:
      'Convert any tweet into a square Instagram graphic. Edit handle, text, and likes, then export a clean 1080x1080 PNG free in your browser.',
    keywords:
      'tweet to Instagram, Twitter screenshot Instagram, X post Instagram maker, turn tweet into post',
  },
  {
    id: 'template8',
    slug: 'sports-hurdels-2',
    name: 'Sports (Hurdels 2)',
    title: 'Sports Graphic Instagram Maker | Instatools',
    h1: 'Make Sports Instagram Graphics',
    description:
      'Design hard-hitting sports Instagram graphics with bold type and player photos. Free alternate sports layout. Export high-res PNG on your device.',
    keywords:
      'sports Instagram graphic, athlete Instagram post, basketball Instagram post maker, free sports post maker',
  },
  {
    id: 'template9',
    slug: 'toad-creek',
    name: 'Toad Creek',
    title: 'Local Business Instagram Post Maker | Instatools',
    h1: 'Make Local Business Instagram Posts',
    description:
      'Create Instagram posts for restaurants, venues, and local spots with bold headlines over photos. Free online. Export 1080x1350 PNG locally.',
    keywords:
      'local business Instagram posts, restaurant Instagram post maker, venue Instagram graphic, free Instagram post maker',
  },
  {
    id: 'template10',
    slug: 'grunge-print',
    name: 'Grunge Print',
    title: 'Poster Style Instagram Post Maker | Instatools',
    h1: 'Make Poster Style Instagram Posts',
    description:
      'Design distressed poster Instagram posts with grunge type and texture. Free for music and culture pages. Export PNG from your browser.',
    keywords:
      'poster Instagram post, grunge Instagram graphic, music Instagram post maker, free Instagram poster maker',
  },
  {
    id: 'template11',
    slug: 'editorial',
    name: 'Editorial',
    title: 'Fashion Instagram Post Maker | Instatools',
    h1: 'Make Fashion Instagram Posts',
    description:
      'Create fashion and culture Instagram posts with a photo and big serif headline. Free magazine look. Export HD 1080x1350 PNG on your device.',
    keywords:
      'fashion Instagram post maker, culture Instagram graphic, magazine Instagram post, free Instagram fashion post',
  },
  {
    id: 'template12',
    slug: 'cutout-stack',
    name: 'Cutout Stack',
    title: 'Rapper Cutout Instagram Maker | Instatools',
    h1: 'Make Rapper Cutout Instagram Posts',
    description:
      'Stack transparent PNG cutouts into collage Instagram posts for rappers and products. Free online. Export a sharp local PNG.',
    keywords:
      'rapper Instagram post, PNG cutout Instagram, collage Instagram post maker, free rap Instagram graphic',
  },
  {
    id: 'template13',
    slug: 'pulse',
    name: 'Pulse',
    title: 'Breaking Alert Instagram Post Maker | Instatools',
    h1: 'Make Breaking Alert Instagram Posts',
    description:
      'Build live-alert Instagram posts with a signal rail and massive type. Free for breaking news pages. Export scroll-stopping 1080x1350 PNG.',
    keywords:
      'breaking news Instagram alert, live Instagram post maker, news alert Instagram graphic, free Instagram post maker',
  },
  {
    id: 'template14',
    slug: 'hazard',
    name: 'Hazard',
    title: 'Athlete News Instagram Post Maker | Instatools',
    h1: 'Make Athlete News Instagram Posts',
    description:
      'Create athlete Instagram posts with hazard stripe rails and huge centered headlines. Free sports news look. Export HD PNG in your browser.',
    keywords:
      'athlete Instagram post, sports news Instagram maker, NFL Instagram graphic, free athlete post maker',
  },
  {
    id: 'template15',
    slug: 'campaign',
    name: 'Campaign',
    title: 'Campaign Instagram Post Maker | Instatools',
    h1: 'Make Campaign Instagram Posts',
    description:
      'Create campaign Instagram posts with a photo background, clean overlay type, and optional framed cutout. Free marketing look. Export HD 1080x1350 PNG locally.',
    keywords:
      'campaign Instagram post, marketing Instagram graphic, brand Instagram post maker, free campaign post maker',
  },
  {
    id: 'template16',
    slug: 'launch',
    name: 'Launch',
    title: 'Product Ad Instagram Maker | Instatools',
    h1: 'Make Product Ad Instagram Posts',
    description:
      'Create SaaS-style Instagram ads with a logo, headline, CTA button, and product shot. Free marketing layout. Export HD 1080x1350 PNG locally.',
    keywords:
      'SaaS Instagram ad, product Instagram ad maker, CTA Instagram graphic, free product ad maker',
  },
]

const ROBOTS = 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'

export const HOME_PAGE = {
  id: 'home',
  path: '/',
  title: 'Free Instagram Post Maker | Instatools',
  h1: 'Free Instagram Post Maker for creators.',
  description: HOME_DESCRIPTION,
  lead:
    'Make scroll-stopping Instagram posts in your browser. Pick a layout, edit the photo and headline, then export HD PNG on your device.',
  keywords:
    'Instagram post maker, free Instagram post maker, Instagram post generator, Instagram graphic maker, make Instagram posts, Instatools',
  faqs: HOME_FAQS,
  robots: ROBOTS,
  changefreq: 'weekly',
  priority: '1.0',
}

export const APP_PAGE = {
  id: 'app',
  path: '/app/',
  title: 'Instagram Post Maker App | Instatools',
  h1: 'Free Instagram Post Maker',
  description: HOME_DESCRIPTION,
  keywords:
    'Instagram post maker, Instagram post generator, free Instagram post maker, make Instagram posts, Instatools',
  robots: 'noindex,follow',
  changefreq: null,
  priority: null,
}

export const NOT_FOUND_PAGE = {
  id: 'not-found',
  path: '/404',
  title: 'Page not found | Instatools',
  h1: 'Page not found',
  description:
    'That Instatools page does not exist. Open the free Instagram post maker or pick a layout to start designing on your device.',
  keywords: '',
  robots: 'noindex,nofollow',
  changefreq: null,
  priority: null,
}

export const THEME_PAGES = THEME_CATALOG.map((theme) => ({
  id: theme.id,
  slug: theme.slug,
  themeName: theme.name,
  path: `/themes/${theme.slug}/`,
  title: theme.title,
  h1: theme.h1,
  description: theme.description,
  keywords: theme.keywords,
  robots: ROBOTS,
  changefreq: 'weekly',
  priority: '0.8',
}))

export const INDEXABLE_PAGES = [HOME_PAGE, ...THEME_PAGES]

export function jsonLdForPage(page) {
  const origin = SITE.origin
  const url = absoluteUrl(page.path === '/404' ? '/' : page.path)
  const image = absoluteUrl(SITE.ogImage.path)
  const graph = [
    {
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: SITE.name,
      url: `${origin}/`,
      logo: absoluteUrl('/favicon.png'),
      sameAs: SITE.sameAs,
    },
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: `${origin}/`,
      name: SITE.name,
      inLanguage: SITE.language,
      publisher: { '@id': `${origin}/#organization` },
    },
  ]

  if (page.id === 'home') {
    graph.push(
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: page.title,
        description: page.description,
        inLanguage: SITE.language,
        isPartOf: { '@id': `${origin}/#website` },
        about: { '@id': `${origin}/#app` },
        primaryImageOfPage: image,
        mainEntity: { '@id': `${origin}/#app` },
      },
      {
        '@type': 'WebApplication',
        '@id': `${origin}/#app`,
        name: 'Instatools Free Instagram Post Maker',
        url: absoluteUrl('/app/'),
        image,
        description: page.description,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        inLanguage: SITE.language,
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [
          'Free Instagram post maker',
          '16 ready-to-edit layouts',
          'Typography and photo controls',
          'Local-only HD PNG and video export',
        ],
        publisher: { '@id': `${origin}/#organization` },
      },
      {
        '@type': 'ItemList',
        '@id': `${origin}/#themes`,
        name: 'Instatools Instagram post layouts',
        numberOfItems: THEME_PAGES.length,
        itemListElement: THEME_PAGES.map((themePage, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: themePage.h1,
          url: absoluteUrl(themePage.path),
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: HOME_FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    )
  } else if (page.slug) {
    graph.push(
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: page.title,
        description: page.description,
        isPartOf: { '@id': `${origin}/#website` },
        about: {
          '@type': 'SoftwareApplication',
          name: page.h1,
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Instagram Post Maker', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: page.h1, item: url },
        ],
      },
    )
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function headTagsForPage(page) {
  const url = absoluteUrl(page.path === '/404' ? '/' : page.path)
  const image = absoluteUrl(SITE.ogImage.path)
  const robots = page.robots
  const jsonLd = JSON.stringify(jsonLdForPage(page))
  const assetBase = process.env.GITHUB_PAGES === 'true' ? '/instatools/' : '/'
  return `    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="keywords" content="${escapeHtml(page.keywords || '')}" />
    <meta name="author" content="${escapeHtml(SITE.name)}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="googlebot" content="${escapeHtml(robots)}" />
    <meta name="theme-color" content="${SITE.themeColor}" />
    <meta name="color-scheme" content="dark light" />
    <meta name="application-name" content="${escapeHtml(SITE.name)}" />
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(SITE.name)}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="canonical" href="${url}" />
    <link rel="manifest" href="${assetBase}site.webmanifest" />
    <link rel="sitemap" type="application/xml" title="Sitemap" href="${absoluteUrl('/sitemap.xml')}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(SITE.name)}" />
    <meta property="og:locale" content="${SITE.locale}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${escapeHtml(SITE.ogImage.alt)}" />
    <meta property="og:image:type" content="${SITE.ogImage.type}" />
    <meta property="og:image:width" content="${SITE.ogImage.width}" />
    <meta property="og:image:height" content="${SITE.ogImage.height}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${escapeHtml(SITE.ogImage.alt)}" />
    <script type="application/ld+json" id="ld-json">${jsonLd}</script>`
}

export function noscriptForPage(page) {
  const links = THEME_PAGES.map(
    (theme) => `      <li><a href="${theme.path}">${escapeHtml(theme.h1)}</a></li>`,
  ).join('\n')
  const faqs = (page.faqs || HOME_FAQS)
    .map(
      (faq) => `        <div>
          <h3>${escapeHtml(faq.question)}</h3>
          <p>${escapeHtml(faq.answer)}</p>
        </div>`,
    )
    .join('\n')
  const lead = page.lead ? `        <p>${escapeHtml(page.lead)}</p>\n` : ''
  return `    <noscript>
      <main>
        <h1>${escapeHtml(page.h1)}</h1>
${lead}        <p>${escapeHtml(page.description)}</p>
        <p><a href="/app/">Try now</a></p>
        <h2>Layouts ready to post</h2>
        <ul>
${links}
        </ul>
        <h2>Frequently asked questions</h2>
${faqs}
      </main>
    </noscript>`
}

export function sitemapXml(lastmod = new Date().toISOString().slice(0, 10)) {
  const urls = INDEXABLE_PAGES.map(
    (page) => `  <url>
    <loc>${absoluteUrl(page.path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

export function robotsTxt() {
  return `User-agent: *
Allow: /
Allow: /themes/
Disallow: /404
Disallow: /404/
Disallow: /app
Disallow: /app/

Sitemap: ${absoluteUrl('/sitemap.xml')}
`
}
