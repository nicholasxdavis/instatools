import { HttpError } from './http'
import { siteOrigin } from './plans'
import type { AppRecord } from './auth'

const STRIPE_API = 'https://api.stripe.com/v1'

function formEncode(data: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === '') continue
    params.set(key, String(value))
  }
  return params
}

async function stripeRequest(env: Env, method: string, path: string, form?: Record<string, string | number | undefined>) {
  const key = env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new HttpError(503, 'billing_unconfigured', 'Billing is not configured.')
  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form ? formEncode(form) : undefined,
  })
  const data = (await response.json().catch(() => ({}))) as { error?: { message?: string }; [k: string]: unknown }
  if (!response.ok) {
    throw new HttpError(response.status === 400 ? 400 : 502, 'stripe_error', data.error?.message || 'Stripe request failed.')
  }
  return data
}

export async function createCheckoutSession(env: Env, app: AppRecord) {
  const price = env.STRIPE_PRICE_PRO?.trim()
  if (!price) throw new HttpError(503, 'billing_unconfigured', 'Pro pricing is not configured.')
  const origin = siteOrigin(env)
  const form: Record<string, string | number | undefined> = {
    mode: 'subscription',
    'line_items[0][price]': price,
    'line_items[0][quantity]': 1,
    success_url: `${origin}/docs/#/pricing?checkout=success`,
    cancel_url: `${origin}/docs/#/pricing?checkout=cancel`,
    client_reference_id: app.id,
    'metadata[appId]': app.id,
    'subscription_data[metadata][appId]': app.id,
  }
  if (app.email) form.customer_email = app.email
  if (app.stripeCustomerId) form.customer = app.stripeCustomerId
  const session = await stripeRequest(env, 'POST', '/checkout/sessions', form)
  const url = typeof session.url === 'string' ? session.url : ''
  if (!url) throw new HttpError(502, 'stripe_error', 'Stripe did not return a checkout URL.')
  return { url, id: String(session.id || '') }
}

export async function createPortalSession(env: Env, app: AppRecord) {
  if (!app.stripeCustomerId) {
    throw new HttpError(400, 'no_subscription', 'No Stripe customer on this key yet. Start Pro checkout first.')
  }
  const session = await stripeRequest(env, 'POST', '/billing_portal/sessions', {
    customer: app.stripeCustomerId,
    return_url: `${siteOrigin(env)}/docs/#/pricing`,
  })
  const url = typeof session.url === 'string' ? session.url : ''
  if (!url) throw new HttpError(502, 'stripe_error', 'Stripe did not return a portal URL.')
  return { url }
}

export async function verifyStripeSignature(payload: string, header: string | null, secret: string) {
  if (!header || !secret) return false
  const parts = header.split(',').map((part) => part.trim())
  let timestamp = ''
  const signatures: string[] = []
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const key = part.slice(0, eq)
    const value = part.slice(eq + 1)
    if (key === 't') timestamp = value
    if (key === 'v1') signatures.push(value)
  }
  if (!timestamp || !signatures.length) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(`${timestamp}.${payload}`))
  const expected = [...new Uint8Array(mac)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return signatures.some((signature) => {
    if (signature.length !== expected.length) return false
    let ok = 0
    for (let i = 0; i < signature.length; i += 1) ok |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
    return ok === 0
  })
}

export type StripeEvent = {
  type: string
  data?: { object?: Record<string, unknown> }
}
