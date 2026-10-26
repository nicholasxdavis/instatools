# Auth

Keys look like `itk_` plus a random token. Store them like passwords. The API hashes them at rest. We email the key once. There is no way to read it back.

## Header

```
Authorization: Bearer itk_...
```

Missing or unknown keys return `401` with `{ "error": "unauthorized" }`.

## Sign up

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"you@example.com\"}"
```

Check email for the key. Requesting again rotates the key.

## Rotate

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/me/keys \
  -H "Authorization: Bearer itk_old_key"
```

The previous key is revoked. Save the new one. This response includes `key` because you already proved you hold the current key.

## Current app

```
GET /v1/me
```

Returns `app` (id, email, plan) and `quota`.

## OpenAPI

```
GET /v1/openapi.json
```

Requires a key.
