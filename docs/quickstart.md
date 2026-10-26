# Quick start

You need an API key. If you do not have one, [apply](https://www.useinstatools.com/apply/).

## 1. Confirm the service

```bash
curl https://instatools-api.nic-58f.workers.dev/v1/health
```

`GET /v1/health` is public. Everything else under `/v1` needs a key, except `POST /v1/apps` which needs the admin token.

## 2. Who you are

```bash
curl https://instatools-api.nic-58f.workers.dev/v1/me \
  -H "Authorization: Bearer itk_your_key"
```

## 3. Pick a template

```bash
curl https://instatools-api.nic-58f.workers.dev/v1/templates/launch \
  -H "Authorization: Bearer itk_your_key"
```

The response includes `defaults`, `fields`, and `jsonSchema`. `launch` is a slug. `template16` is the same layout.

## 4. Create a design

```json
{
  "template": "launch",
  "fields": {
    "headline": "Ship it",
    "buttonText": "Try now"
  }
}
```

`POST /v1/designs` stores it and returns an `id`.

You can also send the native slice:

```json
{
  "template": "template16",
  "t16": { "headline": "Ship it" }
}
```

Or import an `instatools-design` JSON file exported from the maker.

## 5. Render

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/designs/DESIGN_ID/render \
  -H "Authorization: Bearer itk_your_key" \
  --output post.png
```

One-shot, no store:

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/render \
  -H "Authorization: Bearer itk_your_key" \
  -H "Content-Type: application/json" \
  --output post.png \
  -d "{\"template\":\"launch\",\"fields\":{\"headline\":\"Hello\"}}"
```

Image URLs in JSON must be publicly fetchable. Data URIs work up to the 2MB body limit.
