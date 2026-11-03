import type { AppRecord } from './auth'
import { saveApp } from './auth'
import { HttpError, nowIso } from './http'
import { effectivePlanId } from './plans'

const PROMO_CODES: Record<string, { days: number; label: string }> = {
  'u01n-sjsy-h46v': { days: 30, label: 'Pro for 1 month' },
}

function normalizeCode(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

function promoKey(code: string) {
  return `promo:${code}`
}

export type PromoClaim = {
  code: string
  appId: string
  email?: string
  claimedAt: string
  expiresAt: string
}

export async function redeemPromoCode(env: Env, app: AppRecord, rawCode: unknown) {
  const code = normalizeCode(rawCode)
  if (!code) throw new HttpError(400, 'invalid_code', 'Enter a redeem code.')

  const offer = PROMO_CODES[code]
  if (!offer) throw new HttpError(404, 'unknown_code', 'That redeem code is not valid.')

  if (app.stripeSubscriptionId) {
    throw new HttpError(409, 'already_subscribed', 'This account already has Stripe Pro. No redeem needed.')
  }

  if (effectivePlanId(app) === 'pro' && app.proSource === 'redeem' && app.proUntil && Date.parse(app.proUntil) > Date.now()) {
    throw new HttpError(409, 'already_pro', 'This account already has active redeemed Pro.')
  }

  const existing = await env.KV.get<PromoClaim>(promoKey(code), 'json')
  if (existing) {
    throw new HttpError(409, 'code_used', 'This redeem code was already used.')
  }

  const claimedAt = nowIso()
  const expiresAt = new Date(Date.now() + offer.days * 24 * 60 * 60 * 1000).toISOString()
  const claim: PromoClaim = {
    code,
    appId: app.id,
    email: app.email,
    claimedAt,
    expiresAt,
  }

  // Single-use claim. If another request wins the race, fail closed.
  const raced = await env.KV.get(promoKey(code))
  if (raced) throw new HttpError(409, 'code_used', 'This redeem code was already used.')
  await env.KV.put(promoKey(code), JSON.stringify(claim))

  const next = await saveApp(env, {
    ...app,
    plan: 'pro',
    proSource: 'redeem',
    proUntil: expiresAt,
    promoCode: code,
  })

  return {
    ok: true as const,
    message: `Redeemed. Pro is active until ${expiresAt.slice(0, 10)}.`,
    app: next,
    expiresAt,
    label: offer.label,
  }
}
