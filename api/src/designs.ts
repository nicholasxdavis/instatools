import {
  catalog,
  requireTemplate,
  templateStateKey,
  type CatalogTemplate,
  type DesignPost,
} from './catalog'
import {
  assertUuid,
  clone,
  deepMerge,
  HttpError,
  isPlainObject,
  MAX_JSON_BYTES,
  newId,
  nowIso,
  setByPath,
  type JsonRecord,
} from './http'

export type DesignRecord = {
  id: string
  appId: string
  template: string
  slug: string
  createdAt: string
  updatedAt: string
  post: DesignPost
}

function designKey(appId: string, id: string) {
  return `design:${appId}:${id}`
}

export function defaultPost(template: CatalogTemplate): DesignPost {
  return clone(template.defaults)
}

function unwrapBody(raw: JsonRecord): JsonRecord {
  if (raw.type === 'instatools-design' || isPlainObject(raw.design)) {
    const wrapped = isPlainObject(raw.design) ? raw.design : raw
    if (!isPlainObject(wrapped.post)) {
      throw new HttpError(400, 'invalid_design', 'Export JSON is missing design.post.')
    }
    return wrapped.post
  }
  if (isPlainObject(raw.post) && typeof raw.post.template === 'string') {
    return raw.post
  }
  return raw
}

function applyFields(post: DesignPost, template: CatalogTemplate, fields: JsonRecord) {
  const key = template.stateKey
  for (const [rawPath, value] of Object.entries(fields)) {
    if (value === undefined) continue
    const path = rawPath.replace(/^post\./, '')
    if (!path || path === 'template') continue
    if (key === 'style' && (path === 'headline' || path === 'caption' || path === 'bgImage')) {
      post[path] = value as string
      continue
    }
    if (path === key || path.startsWith(`${key}.`) || path === 'style' || path.startsWith('style.')) {
      setByPath(post, path, value)
      continue
    }
    setByPath(post, key === 'style' ? `style.${path}` : `${key}.${path}`, value)
  }
}

export function parseDesignInput(
  raw: JsonRecord,
  fallbackTemplate?: CatalogTemplate,
  basePost?: DesignPost,
) {
  const body = unwrapBody(raw)
  const templateRef =
    (typeof body.template === 'string' && body.template) ||
    fallbackTemplate?.id ||
    fallbackTemplate?.slug
  if (!templateRef) {
    throw new HttpError(400, 'missing_template', 'Provide template as an id or slug.')
  }
  const template = requireTemplate(String(templateRef))
  const next =
    basePost && basePost.template === template.id ? clone(basePost) : defaultPost(template)
  next.template = template.id

  const key = templateStateKey(template.id)
  const explicitSlice = key === 'style' ? body.style : body[key]
  if (key === 'style') {
    if (typeof body.headline === 'string') next.headline = body.headline
    if (typeof body.caption === 'string') next.caption = body.caption
    if (typeof body.bgImage === 'string') next.bgImage = body.bgImage
    if (isPlainObject(body.style)) next.style = deepMerge(next.style || {}, body.style)
  } else if (isPlainObject(explicitSlice)) {
    next[key] = deepMerge(next[key] as JsonRecord, explicitSlice)
  }

  if (isPlainObject(body.fields)) {
    applyFields(next, template, body.fields)
  }

  if (key === 'style') {
    if (!isPlainObject(next.style)) {
      throw new HttpError(400, 'invalid_design', 'This template requires a style object.')
    }
  } else if (!isPlainObject(next[key])) {
    throw new HttpError(400, 'invalid_design', `Design is missing ${key}.`)
  }

  const serialized = JSON.stringify(next)
  if (serialized.length > MAX_JSON_BYTES) {
    throw new HttpError(413, 'payload_too_large', 'Design JSON must be under 2MB.')
  }

  return { template, post: next }
}

export async function deleteAllDesigns(env: Env, appId: string) {
  let cursor: string | undefined
  do {
    const page = await env.KV.list({ prefix: `design:${appId}:`, cursor, limit: 1000 })
    await Promise.all(page.keys.map((key) => env.KV.delete(key.name)))
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
}

export async function countDesigns(env: Env, appId: string) {
  let count = 0
  let cursor: string | undefined
  do {
    const page = await env.KV.list({ prefix: `design:${appId}:`, cursor, limit: 1000 })
    count += page.keys.length
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
  return count
}

export async function createDesign(env: Env, appId: string, raw: JsonRecord) {
  const { template, post } = parseDesignInput(raw)
  const record: DesignRecord = {
    id: newId(),
    appId,
    template: template.id,
    slug: template.slug,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    post,
  }
  await env.KV.put(designKey(appId, record.id), JSON.stringify(record))
  return { record, template }
}

export async function getDesign(env: Env, appId: string, id: string) {
  assertUuid(id, 'design id')
  const record = await env.KV.get<DesignRecord>(designKey(appId, id), 'json')
  if (!record || record.appId !== appId) {
    throw new HttpError(404, 'not_found', 'Design not found.')
  }
  const template = requireTemplate(record.template)
  return { record, template }
}

export async function listDesigns(env: Env, appId: string, limit = 50) {
  const cap = Math.min(200, Math.max(1, Math.floor(limit)))
  const records: DesignRecord[] = []
  let cursor: string | undefined
  do {
    const page = await env.KV.list({ prefix: `design:${appId}:`, cursor, limit: 1000 })
    for (const key of page.keys) {
      const record = await env.KV.get<DesignRecord>(key.name, 'json')
      if (record && record.appId === appId) records.push(record)
    }
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor && records.length < 500)

  records.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  return records.slice(0, cap).map((record) => ({
    id: record.id,
    template: record.template,
    slug: record.slug,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }))
}

export async function updateDesign(
  env: Env,
  appId: string,
  id: string,
  raw: JsonRecord,
  replace = false,
) {
  const current = await getDesign(env, appId, id)
  const { template, post } = parseDesignInput(
    { template: current.record.template, ...raw },
    current.template,
    replace ? undefined : current.record.post,
  )
  const record: DesignRecord = {
    ...current.record,
    template: template.id,
    slug: template.slug,
    updatedAt: nowIso(),
    post,
  }
  await env.KV.put(designKey(appId, record.id), JSON.stringify(record))
  return { record, template }
}

export async function deleteDesign(env: Env, appId: string, id: string) {
  const { record } = await getDesign(env, appId, id)
  await env.KV.delete(designKey(appId, record.id))
}

export function designResponse(record: DesignRecord) {
  return {
    id: record.id,
    template: record.template,
    slug: record.slug,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    post: record.post,
    version: catalog.version,
    type: 'instatools-design',
  }
}
