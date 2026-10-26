# Instatools API

Cloudflare Worker. Other apps authenticate with an API key, edit templates as JSON, and render PNG. Anyone can get a free key by email. Pro raises the monthly render quota.

Docs: https://www.useinstatools.com/docs/  
Signup: https://www.useinstatools.com/signup/

## Run locally

From the repo root:

```bash
cd api
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

API: `http://127.0.0.1:8787`

Local secrets live in `.dev.vars` (gitignored). Copy `.dev.vars.example` if needed.

| Header | Local value |
|---|---|
| `Authorization` | `Bearer itk_dev_local_testing_key` |
| `X-Admin-Token` | `dev-admin-token` |

```bash
curl http://127.0.0.1:8787/v1/templates \
  -H "Authorization: Bearer itk_dev_local_testing_key"
```

## Sign up

Production:

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"you@example.com\"}"
```

The key is emailed. It is not in the JSON response.

## JSON

`GET /v1/templates/:id` (`launch`, `template16`, ...) returns `defaults`, `fields`, and `jsonSchema`.

Create, patch, or render with any of:

```json
{ "template": "launch", "fields": { "headline": "Ship it" } }
```

The renderer compiles the same Vue templates as the public maker.

## Deploy

Do not put Brevo or Stripe keys in git. Set Worker secrets:

```bash
npx wrangler secret put BREVO_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put ADMIN_TOKEN
```

Put the Stripe price id in `wrangler.jsonc` as `STRIPE_PRICE_PRO`, then `npm run deploy`.
