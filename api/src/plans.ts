export type PlanId = 'free' | 'pro'
export type ProSource = 'stripe' | 'redeem'

export type Plan = {
  id: PlanId
  name: string
  rendersPerMonth: number
  maxDesigns: number
  priceUsd: number
  proLayouts: boolean
}

export type PlanBearer = {
  plan?: PlanId | string
  stripeSubscriptionId?: string
  proUntil?: string
  proSource?: ProSource | string
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    rendersPerMonth: 50,
    maxDesigns: 25,
    priceUsd: 0,
    proLayouts: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    rendersPerMonth: 2000,
    maxDesigns: 500,
    priceUsd: 19,
    proLayouts: true,
  },
}

export function planOf(id: string | undefined): Plan {
  return id === 'pro' ? PLANS.pro : PLANS.free
}

export function effectivePlanId(app: PlanBearer | null | undefined): PlanId {
  if (!app) return 'free'
  if (app.stripeSubscriptionId) return 'pro'
  if (app.proUntil) {
    const ends = Date.parse(app.proUntil)
    if (Number.isFinite(ends) && ends > Date.now()) return 'pro'
    return 'free'
  }
  return app.plan === 'pro' ? 'pro' : 'free'
}

export function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function siteOrigin(env: { SITE_ORIGIN?: string }) {
  return (env.SITE_ORIGIN || 'https://www.useinstatools.com').replace(/\/$/, '')
}

export function apiPublicUrl() {
  return 'https://instatools-api.nic-58f.workers.dev'
}
