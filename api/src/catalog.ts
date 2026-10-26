import catalogJson from './catalog.json'
import { HttpError } from './http'

export type CatalogField = {
  group: string
  type: string
  path: string
  label: string
  min?: number
  max?: number
  step?: number
  unit?: string
  hint?: string
  rows?: number
  togglePath?: string
  customPath?: string
  options?: Array<{ label: string; value: string | number }>
  fonts?: string[]
}

export type DesignPost = {
  template: string
  headline?: string
  caption?: string
  bgImage?: string
  style?: Record<string, unknown>
  [slice: string]: unknown
}

export type CatalogTemplate = {
  id: string
  slug: string
  name: string
  note: string
  description: string
  square: boolean
  size: { width: number; height: number }
  stateKey: string
  previewImage: string
  fields: CatalogField[]
  defaults: DesignPost
  jsonSchema: Record<string, unknown>
}

export type Catalog = {
  version: number
  generatedAt: string
  canvas: { width: number; height: number; square: number }
  cdnOrigin: string
  fonts: string[]
  colors: string[]
  templates: CatalogTemplate[]
}

export const catalog = catalogJson as Catalog

if (!Array.isArray(catalog.templates) || catalog.templates.length === 0) {
  throw new Error('catalog.json is missing templates. Run npm run catalog.')
}

export function listTemplates() {
  return catalog.templates.map((template) => ({
    id: template.id,
    slug: template.slug,
    name: template.name,
    note: template.note,
    description: template.description,
    square: template.square,
    size: template.size,
    stateKey: template.stateKey,
    previewImage: template.previewImage,
  }))
}

export function getTemplate(idOrSlug: string) {
  const needle = idOrSlug.trim().toLowerCase()
  if (!needle) return undefined
  return catalog.templates.find(
    (template) => template.id.toLowerCase() === needle || template.slug.toLowerCase() === needle,
  )
}

export function requireTemplate(idOrSlug: string) {
  const template = getTemplate(idOrSlug)
  if (!template) {
    throw new HttpError(404, 'unknown_template', 'Template not found.')
  }
  return template
}

export function templateStateKey(templateId: string) {
  if (!templateId || templateId === 'template1') return 'style'
  return templateId.replace(/^template/, 't')
}

export function templateDetail(template: CatalogTemplate) {
  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    note: template.note,
    description: template.description,
    square: template.square,
    size: template.size,
    stateKey: template.stateKey,
    previewImage: template.previewImage,
    fields: template.fields,
    defaults: template.defaults,
    jsonSchema: template.jsonSchema,
  }
}
