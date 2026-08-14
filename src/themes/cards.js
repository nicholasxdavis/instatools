import { THEME_CATALOG } from '@/seo/catalog'
import { publicUrl } from '@/utils/publicUrl'

/** Lightweight theme list for marketing/SEO (no Preview.vue imports). */
export const THEME_CARDS = THEME_CATALOG.map((theme) => ({
  id: theme.id,
  slug: theme.slug,
  name: theme.name,
  h1: theme.h1,
  description: theme.description,
  previewImage: publicUrl(`themes/${theme.id}.png`),
  cardImage: publicUrl(`themes/cards/${theme.id}.webp`),
  cardImageFallback: publicUrl(`themes/cards/${theme.id}.png`),
  path: `/themes/${theme.slug}/`,
}))

export function themePath(theme) {
  return `/themes/${theme.slug}/`
}
