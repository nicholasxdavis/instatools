import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware, createApp, ensureBootstrap, requireAdmin, rotateKey, type AppRecord } from './auth'
import { catalog, requireTemplate, templateDetail, listTemplates } from './catalog'
import {
  createDesign,
  deleteDesign,
  designResponse,
  getDesign,
  listDesigns,
  parseDesignInput,
  updateDesign,
} from './designs'
import { errorResponse, json, readJson } from './http'
import { openApiDocument } from './openapi'
import { pngResponse, renderPng } from './render'

type Vars = { app: AppRecord; apiKey: string }

const api = new Hono<{ Bindings: Env; Variables: Vars }>()

api.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type', 'X-Admin-Token', 'Accept'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['X-Instatools-Template', 'X-Instatools-Width', 'X-Instatools-Height', 'X-Instatools-Design'],
  maxAge: 86400,
}))

api.use('*', async (c, next) => {
  await ensureBootstrap(c.env)
  await next()
})

api.onError((error) => errorResponse(error))
api.notFound(() => json({ error: 'not_found', message: 'No such route.' }, 404))

api.get('/', () => json({
  service: 'instatools-api',
  access: 'invite-only',
  docs: 'https://www.useinstatools.com/docs/',
  apply: 'https://www.useinstatools.com/apply/',
  health: '/v1/health',
}))

api.get('/robots.txt', () => new Response('User-agent: *\nDisallow: /\n', {
  headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
}))

api.get('/render', (c) => serveRenderer(c.env, c.req.raw))
api.get('/render.html', (c) => serveRenderer(c.env, c.req.raw))

api.get('/v1/health', () => json({
  ok: true,
  service: 'instatools-api',
  templates: catalog.templates.length,
  catalogGeneratedAt: catalog.generatedAt,
}))

api.post('/v1/apps', async (c) => {
  await requireAdmin(c.env, c.req.raw)
  const body = await readJson(c.req.raw)
  const name = typeof body.name === 'string' ? body.name : ''
  const created = await createApp(c.env, name)
  return json({
    app: created.app,
    key: created.key,
    hint: 'Store this key now. It cannot be read back.',
  }, 201)
})

const v1 = new Hono<{ Bindings: Env; Variables: Vars }>()
v1.use('*', authMiddleware)

v1.get('/openapi.json', (c) => json(openApiDocument(new URL(c.req.url).origin)))

v1.get('/me', (c) => json({ app: c.get('app') }))

v1.post('/me/keys', async (c) => {
  const rotated = await rotateKey(c.env, c.get('app'), c.get('apiKey'))
  return json({
    app: rotated.app,
    key: rotated.key,
    hint: 'Store this key now. The previous key is revoked.',
  }, 201)
})

v1.get('/templates', () => json({
  templates: listTemplates(),
  canvas: catalog.canvas,
  fonts: catalog.fonts,
  colors: catalog.colors,
}))

v1.get('/templates/:id', (c) => json(templateDetail(requireTemplate(c.req.param('id')))))

v1.get('/templates/:id/schema', (c) => json(requireTemplate(c.req.param('id')).jsonSchema))

v1.get('/designs', async (c) => {
  const limit = Number(c.req.query('limit') || '50')
  return json({ designs: await listDesigns(c.env, c.get('app').id, limit) })
})

v1.post('/designs', async (c) => {
  const { record } = await createDesign(c.env, c.get('app').id, await readJson(c.req.raw))
  return json(designResponse(record), 201)
})

v1.get('/designs/:id', async (c) => {
  const { record } = await getDesign(c.env, c.get('app').id, c.req.param('id'))
  return json(designResponse(record))
})

v1.patch('/designs/:id', async (c) => {
  const { record } = await updateDesign(c.env, c.get('app').id, c.req.param('id'), await readJson(c.req.raw), false)
  return json(designResponse(record))
})

v1.put('/designs/:id', async (c) => {
  const { record } = await updateDesign(c.env, c.get('app').id, c.req.param('id'), await readJson(c.req.raw), true)
  return json(designResponse(record))
})

v1.delete('/designs/:id', async (c) => {
  await deleteDesign(c.env, c.get('app').id, c.req.param('id'))
  return json({ ok: true })
})

v1.post('/designs/:id/render', async (c) => {
  const { record, template } = await getDesign(c.env, c.get('app').id, c.req.param('id'))
  const png = await renderPng(c.env, c.req.raw, record.post, template)
  return pngResponse(png, template, record.id)
})

v1.post('/render', async (c) => {
  const { template, post } = parseDesignInput(await readJson(c.req.raw))
  const png = await renderPng(c.env, c.req.raw, post, template)
  return pngResponse(png, template)
})

api.route('/v1', v1)

function serveRenderer(env: Env, request: Request) {
  const url = new URL('/index.html', request.url)
  return env.ASSETS.fetch(new Request(url, { method: 'GET' }))
}

export default {
  fetch: (request, env, ctx) => api.fetch(request, env, ctx),
} satisfies ExportedHandler<Env>
