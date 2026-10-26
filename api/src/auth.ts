import type { Context, Next } from 'hono'
import { HttpError, newApiKey, newId, nowIso, sha256Hex, timingSafeEqualString } from './http'

export type AppRecord = {
  id: string
  name: string
  createdAt: string
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
      createdAt: nowIso(),
    }
    const record: KeyRecord = {
      appId: app.id,
      keyId: newId(),
      name: 'bootstrap',
      createdAt: nowIso(),
    }
    await env.KV.put(`app:${app.id}`, JSON.stringify(app))
    await env.KV.put(`key:${hash}`, JSON.stringify(record))
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
  return { app, token }
}

export async function createApp(env: Env, name: string) {
  const trimmed = name.replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (!trimmed) throw new HttpError(400, 'invalid_name', 'App name is required.')
  const app: AppRecord = {
    id: newId(),
    name: trimmed.slice(0, 80),
    createdAt: nowIso(),
  }
  const key = newApiKey()
  const record: KeyRecord = {
    appId: app.id,
    keyId: newId(),
    name: 'default',
    createdAt: nowIso(),
  }
  await env.KV.put(`app:${app.id}`, JSON.stringify(app))
  await env.KV.put(`key:${await sha256Hex(key)}`, JSON.stringify(record))
  return { app, key }
}

export async function rotateKey(env: Env, app: AppRecord, previousToken: string) {
  const key = newApiKey()
  const record: KeyRecord = {
    appId: app.id,
    keyId: newId(),
    name: 'rotated',
    createdAt: nowIso(),
  }
  await env.KV.put(`key:${await sha256Hex(key)}`, JSON.stringify(record))
  if (previousToken.startsWith('itk_')) {
    await env.KV.delete(`key:${await sha256Hex(previousToken)}`)
  }
  return { app, key }
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
