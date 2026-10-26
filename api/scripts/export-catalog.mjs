import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const v2Root = join(apiRoot, '..')
const outFile = join(apiRoot, 'src', 'catalog.json')

const NOTES = {
  template1: 'Breaking news - giant headline over photo',
  template2: 'Interview bar - clean headline over image',
  template3: 'Wealth split - photo plus headline column',
  template4: 'Magazine cover - oversized XXL type',
  template5: 'Dual image - side-by-side compare',
  template6: 'Sports news - bold type and action photo',
  template7: 'Tweet card - square X/Twitter graphic',
  template8: 'Sports alt - hard-hitting player graphic',
  template9: 'Local spot - bold headline over venue photo',
  template10: 'Grunge poster - distressed music print',
  template11: 'Editorial - fashion serif over photo',
  template12: 'Transparent PNGs - rappers, products, etc.',
  template13: 'Live alert - signal rail + huge type',
  template14: 'Sports - hazard stripes + bottom type',
  template15: 'Campaign - photo field, clean type, optional framed cutout',
  template16: 'SaaS ad - logo, CTA, product shot',
  template17: 'Smoke cutout - rapper PNGs on red glow stage',
}

const SQUARE = new Set(['template7'])

function fieldToSchema(field) {
  switch (field.type) {
    case 'toggle':
      return { type: 'boolean', title: field.label }
    case 'slider': {
      const schema = { type: 'number', title: field.label }
      if (field.min != null) schema.minimum = field.min
      if (field.max != null) schema.maximum = field.max
      if (field.step != null) schema.multipleOf = field.step
      return schema
    }
    case 'select':
      return {
        type: typeof field.options?.[0]?.value === 'number' ? 'number' : 'string',
        title: field.label,
        enum: (field.options || []).map((option) => option.value),
      }
    case 'color':
      return { type: 'string', title: field.label }
    case 'image':
      return { type: 'string', title: field.label, description: 'Image URL or data URI' }
    case 'font':
      return { type: 'string', title: field.label || 'Font' }
    default:
      return { type: 'string', title: field.label }
  }
}

function ensureObjectSchema(node, key) {
  if (!node[key] || node[key].type !== 'object') {
    node[key] = { type: 'object', additionalProperties: true, properties: {} }
  }
  node[key].properties ??= {}
  return node[key].properties
}

function assignSchema(rootProps, path, schema) {
  const parts = path.split('.').filter(Boolean)
  if (!parts.length) return
  let current = rootProps
  for (let i = 0; i < parts.length - 1; i += 1) {
    current = ensureObjectSchema(current, parts[i])
  }
  current[parts[parts.length - 1]] = schema
}

function flattenFields(groups) {
  const out = []
  const walk = (fields, group) => {
    for (const field of fields || []) {
      const jsonPath = String(field.path || '').replace(/^post\./, '')
      if (field.type && field.path) {
        out.push({
          group,
          type: field.type,
          path: jsonPath,
          label: field.label || field.type,
          min: field.min,
          max: field.max,
          step: field.step,
          unit: field.unit,
          hint: field.hint,
          rows: field.rows,
          togglePath: field.togglePath ? String(field.togglePath).replace(/^post\./, '') : undefined,
          customPath: field.customPath ? String(field.customPath).replace(/^post\./, '') : undefined,
          options: field.options || undefined,
          fonts: field.fonts || undefined,
        })
      }
      if (field.controls?.length) walk(field.controls, group)
    }
  }
  for (const group of groups || []) walk(group.fields, group.title || 'Fields')
  return out
}

function toJsonSchema(templateId, stateKey, fields) {
  const properties = {
    template: { const: templateId },
  }
  for (const field of fields) {
    if (!field.path) continue
    assignSchema(properties, field.path, fieldToSchema(field))
    if (field.customPath) assignSchema(properties, field.customPath, { type: 'string', title: 'Custom font' })
    if (field.togglePath) assignSchema(properties, field.togglePath, { type: 'boolean' })
  }
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: `${templateId} design`,
    type: 'object',
    required: ['template', stateKey === 'style' ? 'style' : stateKey],
    additionalProperties: true,
    properties,
  }
}

const server = await createServer({
  configFile: join(v2Root, 'vite.config.js'),
  root: v2Root,
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { THEME_CATALOG } = await server.ssrLoadModule('/src/seo/catalog.js')
  const { THEME_FIELDS } = await server.ssrLoadModule('/src/themes/fields.js')
  const { createDefaultState } = await server.ssrLoadModule('/src/themes/defaults.js')
  const { buildDesignPost } = await server.ssrLoadModule('/src/utils/design-io.js')
  const { templateStateKey } = await server.ssrLoadModule('/src/utils/text.js')
  const { POST_WIDTH, POST_HEIGHT, FONTS, COLORS } = await server.ssrLoadModule('/src/config/constants.js')
  const { CDN_ORIGIN } = await server.ssrLoadModule('/src/config/media.js')

  const templates = THEME_CATALOG.map((theme) => {
    const state = createDefaultState()
    state.post.template = theme.id
    const defaults = buildDesignPost(state.post)
    const stateKey = templateStateKey(theme.id)
    const square = SQUARE.has(theme.id)
    const fields = flattenFields(THEME_FIELDS[theme.id] || [])
    return {
      id: theme.id,
      slug: theme.slug,
      name: theme.name,
      note: NOTES[theme.id] || theme.description,
      description: theme.description,
      square,
      size: {
        width: POST_WIDTH,
        height: square ? POST_WIDTH : POST_HEIGHT,
      },
      stateKey,
      previewImage: `${CDN_ORIGIN}/ui/templates/${theme.id}.png`,
      fields,
      defaults,
      jsonSchema: toJsonSchema(theme.id, stateKey, fields),
    }
  })

  const catalog = {
    version: 1,
    generatedAt: new Date().toISOString(),
    canvas: { width: POST_WIDTH, height: POST_HEIGHT, square: POST_WIDTH },
    cdnOrigin: CDN_ORIGIN,
    fonts: FONTS,
    colors: COLORS,
    templates,
  }

  await mkdir(dirname(outFile), { recursive: true })
  await writeFile(outFile, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${templates.length} templates to ${outFile}`)
} finally {
  await server.close()
}
