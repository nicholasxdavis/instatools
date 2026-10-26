# Render

```
POST /v1/render
POST /v1/designs/{id}/render
```

Returns `image/png`. Size headers:

- `X-Instatools-Template`
- `X-Instatools-Width`
- `X-Instatools-Height`
- `X-Instatools-Design` when rendering a stored design

## One-shot

Same JSON as create. Nothing is stored.

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/render \
  -H "Authorization: Bearer itk_your_key" \
  -H "Content-Type: application/json" \
  --output post.png \
  -d "{\"template\":\"campaign\",\"fields\":{\"headline\":\"Tonight only\"}}"
```

## Stored design

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/designs/DESIGN_ID/render \
  -H "Authorization: Bearer itk_your_key" \
  --output post.png
```

## Images

The renderer loads image URLs from the JSON. They must be reachable from Cloudflare's network and allow embedding. jsDelivr and most CDNs are fine. `data:` URIs work inside the 2MB request cap.

## Timing

The Worker opens a headless browser, applies the design, waits for fonts and images, then screenshots the artboard. Expect a few seconds. Timeouts surface as `render_failed`.
