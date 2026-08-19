import Template1Preview from './template1/Preview.vue'
import Template2Preview from './template2/Preview.vue'
import Template3Preview from './template3/Preview.vue'
import Template4Preview from './template4/Preview.vue'
import Template5Preview from './template5/Preview.vue'
import Template6Preview from './template6/Preview.vue'
import Template7Preview from './template7/Preview.vue'
import Template9Preview from './template9/Preview.vue'
import Template10Preview from './template10/Preview.vue'
import Template11Preview from './template11/Preview.vue'
import Template12Preview from './template12/Preview.vue'
import Template13Preview from './template13/Preview.vue'
import Template14Preview from './template14/Preview.vue'
import Template15Preview from './template15/Preview.vue'
import Template16Preview from './template16/Preview.vue'
import Template17Preview from './template17/Preview.vue'
import { THEME_CATALOG } from '@/seo/catalog'
import { THEME_FIELDS } from './fields'
import { publicUrl } from '@/utils/publicUrl'

const PREVIEWS = {
  template1: { component: Template1Preview, fields: THEME_FIELDS.template1, note: 'Breaking news - giant headline over photo' },
  template2: { component: Template2Preview, fields: THEME_FIELDS.template2, note: 'Interview bar - clean headline over image' },
  template3: { component: Template3Preview, fields: THEME_FIELDS.template3, note: 'Wealth split - photo plus headline column' },
  template4: { component: Template4Preview, fields: THEME_FIELDS.template4, note: 'Magazine cover - oversized XXL type' },
  template5: { component: Template5Preview, fields: THEME_FIELDS.template5, note: 'Dual image - side-by-side compare' },
  template6: { component: Template6Preview, props: { variant: 't6' }, fields: THEME_FIELDS.template6, note: 'Sports news - bold type and action photo' },
  template7: { component: Template7Preview, fields: THEME_FIELDS.template7, square: true, note: 'Tweet card - square X/Twitter graphic' },
  template8: { component: Template6Preview, props: { variant: 't8' }, fields: THEME_FIELDS.template8, note: 'Sports alt - hard-hitting player graphic' },
  template9: { component: Template9Preview, fields: THEME_FIELDS.template9, note: 'Local spot - bold headline over venue photo' },
  template10: { component: Template10Preview, fields: THEME_FIELDS.template10, note: 'Grunge poster - distressed music print' },
  template11: { component: Template11Preview, fields: THEME_FIELDS.template11, note: 'Editorial - fashion serif over photo' },
  template12: {
    component: Template12Preview,
    fields: THEME_FIELDS.template12,
    note: 'Transparent PNGs - rappers, products, etc.',
  },
  template13: {
    component: Template13Preview,
    fields: THEME_FIELDS.template13,
    note: 'Live alert - signal rail + huge type',
  },
  template14: {
    component: Template14Preview,
    fields: THEME_FIELDS.template14,
    note: 'Sports - hazard stripes + bottom type',
  },
  template15: {
    component: Template15Preview,
    fields: THEME_FIELDS.template15,
    note: 'Campaign - photo field, clean type, optional framed cutout',
  },
  template16: {
    component: Template16Preview,
    fields: THEME_FIELDS.template16,
    note: 'SaaS ad - logo, CTA, product shot',
  },
  template17: {
    component: Template17Preview,
    fields: THEME_FIELDS.template17,
    note: 'Smoke cutout - rapper PNGs on red glow stage',
  },
}

export const THEMES = THEME_CATALOG.map((theme) => ({
  ...theme,
  previewImage: publicUrl(`themes/${theme.id}.png`),
  cardImage: publicUrl(`themes/cards/${theme.id}.webp`),
  cardImageFallback: publicUrl(`themes/cards/${theme.id}.png`),
  ...PREVIEWS[theme.id],
}))

export { THEME_CARDS, themePath } from './cards'

export function getTheme(id) {
  return THEMES.find((theme) => theme.id === id) || THEMES[0]
}

export function getThemeBySlug(slug) {
  return THEMES.find((theme) => theme.slug === slug)
}
