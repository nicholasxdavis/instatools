# Instatools API

JSON in. PNG out. No AI.

The public maker at [useinstatools.com](https://www.useinstatools.com/) stays free and local. This API is for apps that need the same layouts over HTTP.

<div class="docs-cta">
  <a class="primary" href="https://www.useinstatools.com/signup/">Get a free API key</a>
  <a class="ghost" href="#/quickstart">Quick start</a>
  <a class="ghost" href="#/pricing">Pricing</a>
</div>

## Base URL

```
https://instatools-api.nic-58f.workers.dev
```

Send `Authorization: Bearer itk_...` on authenticated routes.

## What you can do

1. Sign up with an email. We send you a key.
2. List templates and read field schemas.
3. Create a design from defaults plus a JSON patch.
4. Render a 1080x1350 PNG (1080x1080 for the tweet layout).

Free includes 50 PNG renders per month. [Pro](pricing.md) raises that to 2,000.

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

- [Get a key](get-a-key.md)
- [Pricing](pricing.md)
- [Quick start](quickstart.md)
- [Auth](auth.md)
- [Templates](templates.md)
- [Designs](designs.md)
- [Render](render.md)
- [Limits](limits.md)
- [Reference](reference.md)
- [Errors](errors.md)
