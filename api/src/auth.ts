import type { Context, Next } from 'hono'
import { HttpError, newApiKey, newId, nowIso, sha256Hex, timingSafeEqualString } from './http'
import { sendApiKeyEmail, assertEmail, normalizeEmail } from './mail'
import { type PlanId, planOf } from './plans'
import { clientIp, hitRateLimit } from './quota'

export type AppRecord = {
  id: string
  name: string
  email?: string
  plan?: PlanId
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

export async function saveApp(env: Env, app: AppRecord) {
  const next = { ...app, updatedAt: nowIso() }
  await env.KV.put(`app:${app.id}`, JSON.stringify(next))
  return next
}

async function rememberKey(env: Env, appId: string, hash: string) {
  const hashes = (await env.KV.get<string[]>(appKeysKey(appId), 'json')) || []
  if (!hashes.includes(hash)) hashes.push(hash)
  await env.KV.put(appKeysKey(appId), JSON.stringify(hashes.slice(-8)))
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

export async function createApp(env: Env, name: string, email?: string) {
  const trimmed = name.replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (!trimmed) throw new HttpError(400, 'invalid_name', 'App name is required.')
  const app: AppRecord = {
    id: newId(),
    name: trimmed.slice(0, 80),
    email,
    plan: 'free',
    createdAt: nowIso(),
  }
  await env.KV.put(`app:${app.id}`, JSON.stringify(app))
  if (email) await env.KV.put(emailKey(await sha256Hex(email)), app.id)
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

  const existingId = await env.KV.get(emailKey(await sha256Hex(email)))
  let app: AppRecord | null = existingId ? await env.KV.get<AppRecord>(`app:${existingId}`, 'json') : null
  let created = false
  let key: string

  if (app) {
    const issued = await issueKey(env, app, 'rotated')
    key = issued.key
    app = issued.app
  } else {
    const issued = await createApp(env, email.split('@')[0] || 'instatools', email)
    app = issued.app
    key = issued.key
    created = true
  }

  await sendApiKeyEmail(env, { email, key, rotated: !created })
  return {
    ok: true as const,
    created,
    message: created
      ? 'Check your email for the API key.'
      : 'That email already had a key. We sent a new one and revoked the old key.',
  }
}

export function publicApp(app: AppRecord) {
  return {
    id: app.id,
    name: app.name,
    email: app.email || null,
    plan: planOf(app.plan).id,
    createdAt: app.createdAt,
  }
}

export async function rotateKey(env: Env, app: AppRecord, previousToken: string) {
  return issueKey(env, app, 'rotated', previousToken)
}

export function normalizeSignupEmail(value: unknown) {
  return normalizeEmail(value)
}

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: { app: AppRecord; apiKey: string } }>,
  next: Next,
) {
  const { app, token } = await requireApp(c.env, c.req.raw)
  c.set('app', app)
  c.set('apiKey', token)
  await next()
}

export async function applyStripePlan(env: Env, appId: string, patch: Partial<AppRecord>) {
  if (!appId) return
  const app = await env.KV.get<AppRecord>(`app:${appId}`, 'json')
  if (!app) return
  await saveApp(env, { ...app, ...patch })
}
