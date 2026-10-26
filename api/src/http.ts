export type JsonRecord = Record<string, unknown>

const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export const MAX_JSON_BYTES = 2_000_000

export class HttpError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const BASE_HEADERS = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
}

export function json(data: unknown, status = 200, extra?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: { ...BASE_HEADERS, ...extra },
  })
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return json(
      {
        error: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
      error.status,
    )
  }
  console.error(error)
  return json({ error: 'internal_error', message: 'Request failed.' }, 500)
}

export function isPlainObject(value: unknown): value is JsonRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function isSafeKey(key: string) {
  return key.length > 0 && !BLOCKED_KEYS.has(key) && !key.includes('\0')
}

export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch === undefined ? base : (patch as T))
  }
  const next: JsonRecord = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (!isSafeKey(key) || value === undefined) continue
    const previous = next[key]
    next[key] = isPlainObject(previous) && isPlainObject(value) ? deepMerge(previous, value) : value
  }
  return next as T
}

export function setByPath(target: JsonRecord, path: string, value: unknown) {
  const parts = path.split('.').filter(isSafeKey)
  if (!parts.length) return
  let cursor: JsonRecord = target
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]
    const existing = cursor[part]
    if (!isPlainObject(existing)) {
      cursor[part] = {}
    }
    cursor = cursor[part] as JsonRecord
  }
  cursor[parts[parts.length - 1]] = value
}

export function clone<T>(value: T): T {
  return structuredClone(value)
}

export async function readJson(request: Request): Promise<JsonRecord> {
  const declared = Number(request.headers.get('content-length') || '0')
  if (Number.isFinite(declared) && declared > MAX_JSON_BYTES) {
    throw new HttpError(413, 'payload_too_large', 'JSON body must be under 2MB.')
  }
  const buffer = await request.arrayBuffer()
  if (buffer.byteLength > MAX_JSON_BYTES) {
    throw new HttpError(413, 'payload_too_large', 'JSON body must be under 2MB.')
  }
  if (buffer.byteLength === 0) {
    throw new HttpError(400, 'invalid_json', 'Request body is required.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(buffer))
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON.')
  }
  if (!isPlainObject(parsed)) {
    throw new HttpError(400, 'invalid_json', 'Request body must be a JSON object.')
  }
  return parsed
}

export function newId() {
  return crypto.randomUUID()
}

export function nowIso() {
  return new Date().toISOString()
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function timingSafeEqualString(left: string, right: string) {
  const encoder = new TextEncoder()
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ])
  return crypto.subtle.timingSafeEqual(new Uint8Array(leftHash), new Uint8Array(rightHash))
}

export function newApiKey() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `itk_${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function assertUuid(value: string, label = 'id') {
  if (!UUID_RE.test(value)) {
    throw new HttpError(400, 'invalid_id', `Invalid ${label}.`)
  }
  return value
}
