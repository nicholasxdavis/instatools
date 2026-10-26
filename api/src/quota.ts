import type { AppRecord } from './auth'
import { HttpError } from './http'
import { monthKey, planOf } from './plans'

type Usage = { renders: number }

function usageKey(appId: string, month = monthKey()) {
  return `usage:${appId}:${month}`
}

export async function readUsage(env: Env, appId: string) {
  const stored = await env.KV.get<Usage>(usageKey(appId), 'json')
  return { renders: Math.max(0, Number(stored?.renders || 0)) }
}

export async function quotaSnapshot(env: Env, app: AppRecord) {
  const plan = planOf(app.plan)
  const usage = await readUsage(env, app.id)
  return {
    plan: plan.id,
    planName: plan.name,
    month: monthKey(),
    rendersUsed: usage.renders,
    rendersLimit: plan.rendersPerMonth,
    rendersRemaining: Math.max(0, plan.rendersPerMonth - usage.renders),
    designsUsed: 0,
    maxDesigns: plan.maxDesigns,
  }
}

export async function assertRenderQuota(env: Env, app: AppRecord) {
  const snap = await quotaSnapshot(env, app)
  if (snap.rendersUsed >= snap.rendersLimit) {
    throw new HttpError(
      429,
      'quota_exceeded',
      snap.plan === 'free'
        ? `Free plans include ${snap.rendersLimit} PNG renders per month. Upgrade to Pro for ${planOf('pro').rendersPerMonth}.`
        : `This Pro plan includes ${snap.rendersLimit} PNG renders per month.`,
      snap,
    )
  }
  return snap
}

export async function consumeRender(env: Env, app: AppRecord) {
  const usage = await readUsage(env, app.id)
  usage.renders += 1
  await env.KV.put(usageKey(app.id), JSON.stringify(usage), { expirationTtl: 60 * 60 * 24 * 45 })
  return usage
}

export async function assertDesignQuota(env: Env, app: AppRecord, currentCount: number) {
  const plan = planOf(app.plan)
  if (currentCount >= plan.maxDesigns) {
    throw new HttpError(
      429,
      'quota_exceeded',
      `This plan allows ${plan.maxDesigns} saved designs. Delete one or upgrade to Pro.`,
      { maxDesigns: plan.maxDesigns, currentCount, plan: plan.id },
    )
  }
}

export async function hitRateLimit(env: Env, key: string, limit: number, windowSec: number) {
  const stored = await env.KV.get<{ n: number }>(key, 'json')
  const n = Number(stored?.n || 0)
  if (n >= limit) {
    throw new HttpError(429, 'rate_limited', 'Too many requests. Wait a bit and try again.')
  }
  await env.KV.put(key, JSON.stringify({ n: n + 1 }), { expirationTtl: windowSec })
}

export function clientIp(request: Request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
}
