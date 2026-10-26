import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  applyStripePlan,
  authMiddleware,
  createApp,
  ensureBootstrap,
  publicApp,
  requireAdmin,
  rotateKey,
  signupWithEmail,
  wipeApp,
  type AppRecord,
} from './auth'
import { catalog, requireTemplate, templateDetail, listTemplates } from './catalog'
import {
  countDesigns,
  createDesign,
  deleteAllDesigns,
  deleteDesign,
  designResponse,
  getDesign,
  listDesigns,
  parseDesignInput,
  updateDesign,
} from './designs'
import { errorResponse, json, readJson } from './http'
import { openApiDocument } from './openapi'
import { PLANS, siteOrigin } from './plans'
import { assertDesignQuota, assertRenderQuota, consumeRender, quotaSnapshot } from './quota'
import { pngResponse, renderPng } from './render'
import { cancelSubscription, createCheckoutSession, createPortalSession, verifyStripeSignature, type StripeEvent } from './stripe'

type Vars = { app: AppRecord; apiKey: string }

const api = new Hono<{ Bindings: Env; Variables: Vars }>()

api.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type', 'X-Admin-Token', 'Accept', 'Stripe-Signature'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: [
    'X-Instatools-Template',
    'X-Instatools-Width',
    'X-Instatools-Height',
    'X-Instatools-Design',
    'X-Instatools-Plan',
    'X-RateLimit-Remaining',
  ],
  maxAge: 86400,
}))

api.use('*', async (c, next) => {
  await ensureBootstrap(c.env)
  await next()
})

api.onError((error) => errorResponse(error))
api.notFound(() => json({ error: 'not_found', message: 'No such route.' }, 404))

api.get('/', (c) => json({
  service: 'instatools-api',
  access: 'public',
  docs: `${siteOrigin(c.env)}/docs/`,
  signup: `${siteOrigin(c.env)}/signup/`,
  pricing: `${siteOrigin(c.env)}/docs/#/pricing`,
  health: '/v1/health',
  plans: PLANS,
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

api.get('/v1/plans', () => json({ plans: PLANS }))

api.post('/v1/signup', async (c) => {
  const body = await readJson(c.req.raw)
  const result = await signupWithEmail(c.env, c.req.raw, body.email, body.website || body._gotcha)
  return json(result, result.created ? 201 : 200)
})

api.post('/v1/apps', async (c) => {
  await requireAdmin(c.env, c.req.raw)
  const body = await readJson(c.req.raw)
  const name = typeof body.name === 'string' ? body.name : ''
  const created = await createApp(c.env, name)
  return json({
    app: publicApp(created.app),
    key: created.key,
    hint: 'Store this key now. It cannot be read back.',
  }, 201)
})

api.post('/v1/billing/webhook', async (c) => {
  const payload = await c.req.raw.text()
  const secret = c.env.STRIPE_WEBHOOK_SECRET || ''
  const ok = await verifyStripeSignature(payload, c.req.header('stripe-signature') || null, secret)
  if (!ok) return json({ error: 'unauthorized', message: 'Invalid Stripe signature.' }, 401)
  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return json({ error: 'invalid_json', message: 'Invalid Stripe payload.' }, 400)
  }
  await handleStripeEvent(c.env, event)
  return json({ received: true })
})

const v1 = new Hono<{ Bindings: Env; Variables: Vars }>()
v1.use('*', authMiddleware)

v1.get('/openapi.json', (c) => json(openApiDocument(new URL(c.req.url).origin)))

v1.get('/me', async (c) => {
  const app = c.get('app')
  const quota = await quotaSnapshot(c.env, app)
  quota.designsUsed = await countDesigns(c.env, app.id)
  return json({ app: publicApp(app), quota })
})

v1.post('/me/keys', async (c) => {
  const rotated = await rotateKey(c.env, c.get('app'), c.get('apiKey'))
  return json({
    app: publicApp(rotated.app),
    key: rotated.key,
    hint: 'Store this key now. The previous key is revoked.',
  }, 201)
})

v1.post('/billing/checkout', async (c) => {
  const session = await createCheckoutSession(c.env, c.get('app'))
  return json({ url: session.url })
})

v1.post('/billing/portal', async (c) => {
  const session = await createPortalSession(c.env, c.get('app'))
  return json({ url: session.url })
})

v1.delete('/me', async (c) => {
  const app = c.get('app')
  if (app.stripeSubscriptionId) {
    await cancelSubscription(c.env, app.stripeSubscriptionId)
  }
  await deleteAllDesigns(c.env, app.id)
  await wipeApp(c.env, app, c.get('apiKey'))
  return json({ ok: true, deleted: true })
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
  const app = c.get('app')
  await assertDesignQuota(c.env, app, await countDesigns(c.env, app.id))
  const { record } = await createDesign(c.env, app.id, await readJson(c.req.raw))
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
  const app = c.get('app')
  await assertRenderQuota(c.env, app)
  const { record, template } = await getDesign(c.env, app.id, c.req.param('id'))
  const png = await renderPng(c.env, c.req.raw, record.post, template)
  const usage = await consumeRender(c.env, app)
  return pngResponse(png, template, record.id, usage)
})

v1.post('/render', async (c) => {
  const app = c.get('app')
  await assertRenderQuota(c.env, app)
  const { template, post } = parseDesignInput(await readJson(c.req.raw))
  const png = await renderPng(c.env, c.req.raw, post, template)
  const usage = await consumeRender(c.env, app)
  return pngResponse(png, template, undefined, usage)
})

api.route('/v1', v1)

async function handleStripeEvent(env: Env, event: StripeEvent) {
  const obj = event.data?.object || {}
  const metadata = (obj.metadata && typeof obj.metadata === 'object') ? obj.metadata as Record<string, unknown> : {}
  const appId = String(obj.client_reference_id || metadata.appId || '')
  if (event.type === 'checkout.session.completed') {
    await applyStripePlan(env, appId, {
      plan: 'pro',
      stripeCustomerId: typeof obj.customer === 'string' ? obj.customer : undefined,
      stripeSubscriptionId: typeof obj.subscription === 'string' ? obj.subscription : undefined,
    })
    return
  }
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const status = String(obj.status || '')
    const active = status === 'active' || status === 'trialing'
    const pro = event.type !== 'customer.subscription.deleted' && active
    await applyStripePlan(env, appId, {
      plan: pro ? 'pro' : 'free',
      stripeCustomerId: typeof obj.customer === 'string' ? obj.customer : undefined,
      stripeSubscriptionId: pro && typeof obj.id === 'string' ? obj.id : '',
    })
  }
}

function serveRenderer(env: Env, request: Request) {
  const url = new URL('/index.html', request.url)
  return env.ASSETS.fetch(new Request(url, { method: 'GET' }))
}

export default {
  fetch: (request, env, ctx) => api.fetch(request, env, ctx),
} satisfies ExportedHandler<Env>
