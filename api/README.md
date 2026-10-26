# Instatools API

Invite-only Cloudflare Worker. Other apps authenticate with an API key, edit templates as JSON, and render PNG. The public maker stays local in the browser.

Docs: https://www.useinstatools.com/docs/  
Apply: https://www.useinstatools.com/apply/

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

Use `instatools-testing` as the client, or:

```bash
curl http://127.0.0.1:8787/v1/templates \
  -H "Authorization: Bearer itk_dev_local_testing_key"
```

## App keys

Each consumer (app, agent, script) gets its own key:

```bash
curl -X POST http://127.0.0.1:8787/v1/apps \
  -H "X-Admin-Token: dev-admin-token" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"my-agent\"}"
```

The `key` is shown once. Rotate with `POST /v1/me/keys`.

## JSON

`GET /v1/templates/:id` (`launch`, `template16`, ...) returns `defaults`, `fields`, and `jsonSchema`.

Create, patch, or render with any of:

```json
{ "template": "launch", "fields": { "headline": "Ship it" } }
```

```json
{ "template": "template16", "t16": { "headline": "Ship it" } }
```

Or an `instatools-design` export from the editor. `PATCH /v1/designs/:id` merges onto the stored design. `fields` keys may be catalog paths (`t16.headline`) or slice keys (`headline`).

## Render

```bash
curl -X POST http://127.0.0.1:8787/v1/render \
  -H "Authorization: Bearer itk_dev_local_testing_key" \
  -H "Content-Type: application/json" \
  --output post.png \
  -d "{\"template\":\"launch\",\"fields\":{\"headline\":\"Hello from the API\"}}"
```

The Worker screenshots the bundled renderer (`dist/`), which compiles the Vue templates from `../src`.

## Deploy

From `api/`:

```bash
npx wrangler kv namespace create KV
```

Put the namespace id in `wrangler.jsonc`, then:

```bash
npx wrangler secret put ADMIN_TOKEN
npm run deploy
```

Do not set `BOOTSTRAP_API_KEY` in production. Mint keys with the admin token after an apply request.
