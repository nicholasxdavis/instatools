# Templates

```
GET /v1/templates
GET /v1/templates/{id}
GET /v1/templates/{id}/schema
```

`{id}` is a template id (`template16`) or slug (`launch`).

## List payload

Each item has `id`, `slug`, `name`, `note`, `size`, `stateKey`, and `previewImage`.

Canvas size is 1080x1350 except `twitter-x-post` (`template7`), which is 1080x1080.

## Detail payload

| Field | Meaning |
| --- | --- |
| `defaults` | Full design JSON for that layout |
| `fields` | Editable controls, with `path`, `type`, `label`, min/max |
| `jsonSchema` | JSON Schema for the design object |

## `fields` paths

Paths are relative to the design post, without a `post.` prefix.

Examples:

- `headline` on News Classic
- `t16.headline` on Launch
- `style.fontSize` on News Classic

When you send a `fields` object you can use those full paths, or keys on the active slice (`headline` on Launch writes `t16.headline`).

## Layouts

| Slug | Id | Notes |
| --- | --- | --- |
| news-classic | template1 | Breaking news |
| clean-no-jumper | template2 | Interview bar |
| wealth-split | template3 | Photo plus type column |
| magazine-xxl | template4 | Oversized cover type |
| dual-image | template5 | Side by side |
| sports-hurdels | template6 | Sports news |
| twitter-x-post | template7 | Square tweet card |
| sports-hurdels-2 | template8 | Sports alt |
| toad-creek | template9 | Local spot |
| grunge-print | template10 | Poster |
| editorial | template11 | Fashion serif |
| cutout-stack | template12 | PNG cutouts |
| pulse | template13 | Live alert |
| hazard | template14 | Sports stripes |
| campaign | template15 | Photo plus type |
| launch | template16 | SaaS ad |
| smoke-cutout | template17 | Cutouts on glow |
