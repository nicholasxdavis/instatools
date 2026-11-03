import type { Context, Next } from 'hono'
import { HttpError, newApiKey, newId, newOpaqueToken, nowIso, sha256Hex, timingSafeEqualString } from './http'
import { sendApiKeyEmail, sendLoginEmail, assertEmail, normalizeEmail } from './mail'
import { effectivePlanId, type PlanId } from './plans'
import { clientIp, hitRateLimit } from './quota'

export type AppRecord = {
  id: string
  name: string
  email?: string
  plan?: PlanId
  proUntil?: string
  proSource?: 'stripe' | 'redeem' | string
  promoCode?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  createdAt: string
  updatedAt?: string
}

export type KeyRecord = {
  appId: string
  keyId: string
  name: string
  createdAt: string
}

const BOOTSTRAP_APP_ID = '00000000-0000-4000-8000-000000000001'

let bootstrapped = false

function bearer(request: Request) {
  const header = request.headers.get('authorization') || ''
  const match = /^Bearer\s+(\S+)$/i.exec(header)
  return match?.[1] || ''
}

function emailKey(hash: string) {
  return `email:${hash}`
}

function appKeysKey(appId: string) {
  return `appkeys:${appId}`
}

function appSessKey(appId: string) {
  return `appsess:${appId}`
}

type SessionRecord = { appId: string }
type LoginRecord = { appId: string }

export async function saveApp(env: Env, app: AppRecord) {
  const next = { ...app, updatedAt: nowIso() }
  await env.KV.put(`app:${app.id}`, JSON.stringify(next))
  return next
}

async function rememberList(env: Env, key: string, hash: string) {
  const hashes = (await env.KV.get<string[]>(key, 'json')) || []
  if (!hashes.includes(hash)) hashes.push(hash)
  await env.KV.put(key, JSON.stringify(hashes.slice(-8)))
}

async function rememberKey(env: Env, appId: string, hash: string) {
  await rememberList(env, appKeysKey(appId), hash)
}

async function rememberSession(env: Env, appId: string, hash: string) {
  await rememberList(env, appSessKey(appId), hash)
}

async function revokeSessions(env: Env, appId: string) {
  const hashes = (await env.KV.get<string[]>(appSessKey(appId), 'json')) || []
  await Promise.all(hashes.map((hash) => env.KV.delete(`sess:${hash}`)))
  await env.KV.delete(appSessKey(appId))
}

async function revokeKeys(env: Env, appId: string, extraHash?: string) {
  const hashes = new Set((await env.KV.get<string[]>(appKeysKey(appId), 'json')) || [])
  if (extraHash) hashes.add(extraHash)
  await Promise.all([...hashes].map((hash) => env.KV.delete(`key:${hash}`)))
  await env.KV.delete(appKeysKey(appId))
}

async function issueKey(env: Env, app: AppRecord, name: string, previousToken?: string) {
  const extraHash = previousToken?.startsWith('itk_') ? await sha256Hex(previousToken) : undefined
  await revokeKeys(env, app.id, extraHash)
  const key = newApiKey()
  const hash = await sha256Hex(key)
  const record: KeyRecord = {
    appId: app.id,
    keyId: newId(),
    name,
    createdAt: nowIso(),
  }
  await env.KV.put(`key:${hash}`, JSON.stringify(record))
  await rememberKey(env, app.id, hash)
  return { app, key }
}

export async function ensureBootstrap(env: Env) {
  if (bootstrapped) return
  const key = env.BOOTSTRAP_API_KEY?.trim()
  if (!key) {
    bootstrapped = true
    return
  }
  const hash = await sha256Hex(key)
  const existing = await env.KV.get(`key:${hash}`)
  if (!existing) {
    const app: AppRecord = {
      id: BOOTSTRAP_APP_ID,
      name: (env.BOOTSTRAP_APP_NAME || 'instatools-testing').slice(0, 80),
      plan: 'free',
      createdAt: nowIso(),
    }
    await env.KV.put(`app:${app.id}`, JSON.stringify(app))
    const record: KeyRecord = {
      appId: app.id,
      keyId: newId(),
      name: 'bootstrap',
      createdAt: nowIso(),
    }
    await env.KV.put(`key:${hash}`, JSON.stringify(record))
    await rememberKey(env, app.id, hash)
  }
  bootstrapped = true
}

export async function requireAdmin(env: Env, request: Request) {
  const expected = env.ADMIN_TOKEN || ''
  const provided = request.headers.get('x-admin-token') || ''
  if (!expected || !(await timingSafeEqualString(provided, expected))) {
    throw new HttpError(401, 'unauthorized', 'Valid X-Admin-Token header required.')
  }
}

export async function requireApp(env: Env, request: Request) {
  const token = bearer(request)
  if (token.startsWith('sess_')) {
    const record = await env.KV.get<SessionRecord>(`sess:${await sha256Hex(token)}`, 'json')
    if (!record?.appId) {
      throw new HttpError(401, 'unauthorized', 'Session expired. Sign in again.')
    }
    const app = await env.KV.get<AppRecord>(`app:${record.appId}`, 'json')
    if (!app) {
      throw new HttpError(401, 'unauthorized', 'Account for this session no longer exists.')
    }
    if (!app.plan) app.plan = 'free'
    return { app, token }
  }
  if (!token.startsWith('itk_')) {
    throw new HttpError(401, 'unauthorized', 'Invalid API key.')
  }
  const record = await env.KV.get<KeyRecord>(`key:${await sha256Hex(token)}`, 'json')
  if (!record?.appId) {
    throw new HttpError(401, 'unauthorized', 'Unknown or revoked API key.')
  }
  const app = await env.KV.get<AppRecord>(`app:${record.appId}`, 'json')
  if (!app) {
    throw new HttpError(401, 'unauthorized', 'App for this API key no longer exists.')
  }
  if (!app.plan) app.plan = 'free'
  return { app, token }
}

export async function findOrCreateAppByEmail(env: Env, email: string) {
  const existingId = await env.KV.get(emailKey(await sha256Hex(email)))
  const existing = existingId ? await env.KV.get<AppRecord>(`app:${existingId}`, 'json') : null
  if (existing) return { app: existing, created: false }

  const app: AppRecord = {
    id: newId(),
    name: (email.split('@')[0] || 'instatools').slice(0, 80),
    email,
    plan: 'free',
    createdAt: nowIso(),
  }
  await env.KV.put(`app:${app.id}`, JSON.stringify(app))
  await env.KV.put(emailKey(await sha256Hex(email)), app.id)
  return { app, created: true }
}

export async function createApp(env: Env, name: string, email?: string) {
  const trimmed = name.replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (!trimmed) throw new HttpError(400, 'invalid_name', 'App name is required.')
  if (email) {
    const found = await findOrCreateAppByEmail(env, email)
    if (!found.created) return issueKey(env, found.app, 'default')
    const named = await saveApp(env, { ...found.app, name: trimmed.slice(0, 80) })
    return issueKey(env, named, 'default')
  }
  const app: AppRecord = {
    id: newId(),
    name: trimmed.slice(0, 80),
    plan: 'free',
    createdAt: nowIso(),
  }
  await env.KV.put(`app:${app.id}`, JSON.stringify(app))
  return issueKey(env, app, 'default')
}

export async function signupWithEmail(env: Env, request: Request, rawEmail: unknown, honeypot?: unknown) {
  if (typeof honeypot === 'string' && honeypot.trim()) {
    return { ok: true as const, created: false, message: 'Check your email for the API key.' }
  }
  const email = assertEmail(rawEmail)
  const ip = clientIp(request)
  await hitRateLimit(env, `rl:signup:ip:${ip}`, 8, 3600)
  await hitRateLimit(env, `rl:signup:email:${await sha256Hex(email)}`, 3, 86400)

  const found = await findOrCreateAppByEmail(env, email)
  const issued = await issueKey(env, found.app, found.created ? 'default' : 'rotated')
  const app = issued.app
  const key = issued.key
  const created = found.created

  await sendApiKeyEmail(env, { email, key, rotated: !created })
  return {
    ok: true as const,
    created,
    message: created
      ? 'Check your email for the API key.'
      : 'That email already had a key. We sent a new one and revoked the old key.',
  }
}

export async function hydrateAppPlan(env: Env, app: AppRecord) {
  const plan = effectivePlanId(app)
  if (plan === 'pro') {
    if (app.plan !== 'pro') return saveApp(env, { ...app, plan: 'pro' })
    return app
  }
  // Expired redeem (or stale pro flag without Stripe) demotes to free.
  if (app.plan === 'pro' && !app.stripeSubscriptionId) {
    return saveApp(env, {
      ...app,
      plan: 'free',
    })
  }
  if (!app.plan) return saveApp(env, { ...app, plan: 'free' })
  return app
}

export function publicApp(app: AppRecord) {
  const plan = effectivePlanId(app)
  return {
    id: app.id,
    name: app.name,
    email: app.email || null,
    plan,
    proUntil: plan === 'pro' ? app.proUntil || null : null,
    proSource: plan === 'pro' ? app.proSource || null : null,
    createdAt: app.createdAt,
  }
}

export async function rotateKey(env: Env, app: AppRecord, previousToken: string) {
  return issueKey(env, app, 'rotated', previousToken)
}

export async function startLogin(env: Env, request: Request, rawEmail: unknown, honeypot?: unknown) {
  if (typeof honeypot === 'string' && honeypot.trim()) {
    return { ok: true as const, message: 'Check your email for a login link.' }
  }
  const email = assertEmail(rawEmail)
  const ip = clientIp(request)
  await hitRateLimit(env, `rl:login:ip:${ip}`, 8, 3600)
  await hitRateLimit(env, `rl:login:email:${await sha256Hex(email)}`, 5, 86400)
  const { app } = await findOrCreateAppByEmail(env, email)
  const token = newOpaqueToken('login')
  await env.KV.put(`login:${await sha256Hex(token)}`, JSON.stringify({ appId: app.id } satisfies LoginRecord), {
    expirationTtl: 15 * 60,
  })
  await sendLoginEmail(env, { email, token })
  return { ok: true as const, message: 'Check your email for a login link.' }
}

export async function exchangeLogin(env: Env, rawToken: unknown) {
  const token = typeof rawToken === 'string' ? rawToken.trim() : ''
  if (!token.startsWith('login_')) {
    throw new HttpError(400, 'invalid_token', 'That login link is invalid.')
  }
  const hash = await sha256Hex(token)
  const record = await env.KV.get<LoginRecord>(`login:${hash}`, 'json')
  await env.KV.delete(`login:${hash}`)
  if (!record?.appId) {
    throw new HttpError(401, 'unauthorized', 'That login link expired. Request a new one.')
  }
  const app = await env.KV.get<AppRecord>(`app:${record.appId}`, 'json')
  if (!app) {
    throw new HttpError(401, 'unauthorized', 'Account for this login link no longer exists.')
  }
  if (!app.plan) app.plan = 'free'

  const session = newOpaqueToken('sess')
  const sessHash = await sha256Hex(session)
  await env.KV.put(`sess:${sessHash}`, JSON.stringify({ appId: app.id } satisfies SessionRecord), {
    expirationTtl: 60 * 60 * 24 * 30,
  })
  await rememberSession(env, app.id, sessHash)

  const hashes = (await env.KV.get<string[]>(appKeysKey(app.id), 'json')) || []
  let key: string | undefined
  if (!hashes.length) {
    key = (await issueKey(env, app, 'default')).key
  }
  return { session, key, app }
}

export function normalizeSignupEmail(value: unknown) {
  return normalizeEmail(value)
}

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: { app: AppRecord; apiKey: string } }>,
  next: Next,
) {
  const { app, token } = await requireApp(c.env, c.req.raw)
  const hydrated = await hydrateAppPlan(c.env, app)
  c.set('app', hydrated)
  c.set('apiKey', token)
  await next()
}

export async function applyStripePlan(env: Env, appId: string, patch: Partial<AppRecord>) {
  if (!appId) return
  const app = await env.KV.get<AppRecord>(`app:${appId}`, 'json')
  if (!app) return
  const nextPlan = patch.plan === 'pro' || patch.stripeSubscriptionId ? 'pro' : patch.plan === 'free' ? 'free' : app.plan
  await saveApp(env, {
    ...app,
    ...patch,
    plan: nextPlan,
    proSource: nextPlan === 'pro' ? 'stripe' : app.proSource,
    proUntil: nextPlan === 'pro' && patch.stripeSubscriptionId ? undefined : patch.plan === 'free' ? undefined : app.proUntil,
  })
}

export async function wipeApp(env: Env, app: AppRecord, previousToken?: string) {
  const extraHash = previousToken?.startsWith('itk_') ? await sha256Hex(previousToken) : undefined
  await revokeKeys(env, app.id, extraHash)
  await revokeSessions(env, app.id)
  if (app.email) await env.KV.delete(emailKey(await sha256Hex(app.email)))
  await env.KV.delete(`app:${app.id}`)
  const now = new Date()
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  await env.KV.delete(`usage:${app.id}:${month}`)
}
