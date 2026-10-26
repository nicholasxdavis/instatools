# Instatools API

Invite-only JSON API for Instatools layouts. Apps and agents pick a template, edit it as JSON, and render a PNG.

The public maker at [useinstatools.com](https://www.useinstatools.com/) stays free and local. This API is for products that need the same layouts over HTTP.

## Base URL

```
https://instatools-api.nic-58f.workers.dev
```

All JSON routes live under `/v1`. Send `Authorization: Bearer itk_...` on every authenticated call.

## What you can do

1. List templates and read field schemas.
2. Create a design from defaults plus a JSON patch.
3. Patch or replace that JSON later.
4. Render a 1080x1350 PNG (1080x1080 for the tweet layout).

## Get access

Keys are issued by request. [Apply for a key](https://www.useinstatools.com/apply/), then come back here.

## Example

```bash
curl https://instatools-api.nic-58f.workers.dev/v1/templates \
  -H "Authorization: Bearer itk_your_key"
```

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/render \
  -H "Authorization: Bearer itk_your_key" \
  -H "Content-Type: application/json" \
  --output post.png \
  -d "{\"template\":\"launch\",\"fields\":{\"headline\":\"Hello from the API\"}}"
```

## In this set

- [Quick start](quickstart.md)
- [Auth](auth.md)
- [Templates](templates.md)
- [Designs](designs.md)
- [Render](render.md)
- [Reference](reference.md)
- [Errors](errors.md)
