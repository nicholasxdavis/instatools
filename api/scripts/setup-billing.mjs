import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const varsPath = join(root, '.dev.vars')
const wranglerPath = join(root, 'wrangler.jsonc')

function parseVars(text) {
  const out = {}
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
  return out
}

function serializeVars(data) {
  return Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n'
}

function formEncode(data) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === '') continue
    params.append(key, String(value))
  }
  return params
}

async function stripe(secret, method, path, form) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form ? formEncode(form) : undefined,
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || `Stripe ${method} ${path} failed (${response.status})`)
  }
  return data
}

const vars = parseVars(readFileSync(varsPath, 'utf8'))
const secret = vars.STRIPE_SECRET_KEY
if (!secret) throw new Error('STRIPE_SECRET_KEY missing from .dev.vars')

const products = await stripe(secret, 'GET', '/products?limit=100&active=true')
let product = (products.data || []).find((item) => item.name === 'Instatools API Pro')
if (!product) {
  product = await stripe(secret, 'POST', '/products', {
    name: 'Instatools API Pro',
    description: 'Higher monthly PNG render quota for the Instatools HTTP API.',
  })
  console.log('created product', product.id)
} else {
  console.log('using product', product.id)
}

const prices = await stripe(secret, 'GET', `/prices?product=${product.id}&active=true&limit=20`)
let price = (prices.data || []).find((item) => item.unit_amount === 1900 && item.recurring?.interval === 'month')
if (!price) {
  price = await stripe(secret, 'POST', '/prices', {
    product: product.id,
    currency: 'usd',
    unit_amount: 1900,
    'recurring[interval]': 'month',
  })
  console.log('created price', price.id)
} else {
  console.log('using price', price.id)
}

const hookUrl = 'https://instatools-api.nic-58f.workers.dev/v1/billing/webhook'
const hooks = await stripe(secret, 'GET', '/webhook_endpoints?limit=100')
let hook = (hooks.data || []).find((item) => item.url === hookUrl)
if (!hook) {
  hook = await stripe(secret, 'POST', '/webhook_endpoints', {
    url: hookUrl,
    'enabled_events[0]': 'checkout.session.completed',
    'enabled_events[1]': 'customer.subscription.updated',
    'enabled_events[2]': 'customer.subscription.deleted',
    'enabled_events[3]': 'invoice.paid',
    'enabled_events[4]': 'invoice.payment_failed',
  })
  console.log('created webhook', hook.id)
} else {
  console.log('using webhook', hook.id)
}

if (hook.secret) {
  vars.STRIPE_WEBHOOK_SECRET = hook.secret
  console.log('stored new webhook secret in .dev.vars')
} else if (!vars.STRIPE_WEBHOOK_SECRET) {
  console.log('existing webhook has no secret in the API response; keep the current STRIPE_WEBHOOK_SECRET')
}

vars.STRIPE_PRICE_PRO = price.id
writeFileSync(varsPath, serializeVars(vars))

const wrangler = readFileSync(wranglerPath, 'utf8')
const nextWrangler = wrangler.includes('"STRIPE_PRICE_PRO"')
  ? wrangler.replace(/"STRIPE_PRICE_PRO":\s*"[^"]*"/, `"STRIPE_PRICE_PRO": "${price.id}"`)
  : wrangler.replace(
      '"BREVO_SENDER_NAME": "Blacnova Development"',
      `"BREVO_SENDER_NAME": "Blacnova Development",\n    "STRIPE_PRICE_PRO": "${price.id}"`,
    )
writeFileSync(wranglerPath, nextWrangler)
console.log('price id written to wrangler.jsonc')

try {
  await stripe(secret, 'POST', '/billing_portal/configurations', {
    'business_profile[headline]': 'Instatools API',
    'features[subscription_cancel][enabled]': 'true',
    'features[invoice_history][enabled]': 'true',
    'features[customer_update][enabled]': 'true',
    'features[customer_update][allowed_updates][0]': 'email',
  })
  console.log('billing portal configuration created')
} catch (error) {
  console.log('billing portal:', error.message)
}
