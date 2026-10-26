# Auth

Keys look like `itk_` plus a random token. Store them like passwords. The API hashes them at rest.

## Header

```
Authorization: Bearer itk_...
```

Missing or unknown keys return `401` with `{ "error": "unauthorized" }`.

## Create an app (admin)

Used by Instatools operators after an [apply](https://www.useinstatools.com/apply/) request is approved.

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/apps \
  -H "X-Admin-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"my-agent\"}"
```

Response includes `key` once. There is no way to read it back.

## Rotate

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/me/keys \
  -H "Authorization: Bearer itk_old_key"
```

The previous key is revoked. Save the new one.

## Current app

```
GET /v1/me
```

## OpenAPI

```
GET /v1/openapi.json
```

Requires a key.
