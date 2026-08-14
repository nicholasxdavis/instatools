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
import { THEME_CATALOG } from '@/seo/catalog'
import { THEME_FIELDS } from './fields'

const PREVIEWS = {
  template1: { component: Template1Preview, fields: THEME_FIELDS.template1 },
  template2: { component: Template2Preview, fields: THEME_FIELDS.template2 },
  template3: { component: Template3Preview, fields: THEME_FIELDS.template3 },
  template4: { component: Template4Preview, fields: THEME_FIELDS.template4 },
  template5: { component: Template5Preview, fields: THEME_FIELDS.template5 },
  template6: { component: Template6Preview, props: { variant: 't6' }, fields: THEME_FIELDS.template6 },
  template7: { component: Template7Preview, fields: THEME_FIELDS.template7, square: true },
  template8: { component: Template6Preview, props: { variant: 't8' }, fields: THEME_FIELDS.template8 },
  template9: { component: Template9Preview, fields: THEME_FIELDS.template9 },
  template10: { component: Template10Preview, fields: THEME_FIELDS.template10 },
  template11: { component: Template11Preview, fields: THEME_FIELDS.template11 },
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
}

export const THEMES = THEME_CATALOG.map((theme) => ({
  ...theme,
  previewImage: `/themes/${theme.id}.png`,
  cardImage: `/themes/cards/${theme.id}.webp`,
  cardImageFallback: `/themes/cards/${theme.id}.png`,
  ...PREVIEWS[theme.id],
}))

export function getTheme(id) {
  return THEMES.find((theme) => theme.id === id) || THEMES[0]
}

export function getThemeBySlug(slug) {
  return THEMES.find((theme) => theme.slug === slug)
}

export function themePath(theme) {
  return `/themes/${theme.slug}/`
}
