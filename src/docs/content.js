const API = 'https://instatools-api.nic-58f.workers.dev'

export const DOC_PAGES = [
  {
    slug: '',
    title: 'API',
    heading: 'JSON in. PNG out.',
    lead: 'Same layouts as Instatools. JSON in, PNG out. Pro layouts need a Pro plan.',
  },
  {
    slug: 'quickstart',
    title: 'Quick start',
    heading: 'Render a post in five minutes.',
    lead: 'Open an account with your email. Copy the key. Hit render.',
  },
  {
    slug: 'auth',
    title: 'Auth',
    heading: 'Keys and login.',
    lead: 'Dashboard login uses a magic link. Apps use an API key.',
  },
  {
    slug: 'templates',
    title: 'Templates',
    heading: 'Seventeen layouts.',
    lead: 'Each template has defaults, fields, and JSON Schema. Three are Pro-only.',
  },
  {
    slug: 'designs',
    title: 'Designs',
    heading: 'Store a layout as JSON.',
    lead: 'Create, patch, replace, or delete. Designs stay on your account.',
  },
  {
    slug: 'render',
    title: 'Render',
    heading: 'JSON to PNG.',
    lead: 'One-shot or from a stored design. Successful renders count against quota.',
  },
  {
    slug: 'limits',
    title: 'Limits',
    heading: 'Free and Pro caps.',
    lead: 'Pro unlocks premium layouts plus higher render and design caps. Renders reset on the 1st of each UTC month.',
  },
  {
    slug: 'reference',
    title: 'Reference',
    heading: 'Every route.',
    lead: `Base URL ${API}`,
  },
  {
    slug: 'errors',
    title: 'Errors',
    heading: 'JSON error shape.',
    lead: 'Failed renders are not billed.',
  },
]

export function docBySlug(slug = '') {
  return DOC_PAGES.find((page) => page.slug === slug) || DOC_PAGES[0]
}

export { API as DOCS_API }
