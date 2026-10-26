# Reference

Base URL: `https://instatools-api.nic-58f.workers.dev`

Auth: `Authorization: Bearer itk_...` unless noted.

Machine-readable: `GET /v1/openapi.json` (requires a key).

## Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/` | Service descriptor |
| GET | `/v1/health` | Liveness, template count |
| GET | `/robots.txt` | Disallow all |
| POST | `/v1/apps` | Admin only. `X-Admin-Token`. `{ "name": "my-agent" }` |

## App

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/me` | Current app |
| POST | `/v1/me/keys` | Rotate key. Previous key revoked. |
| GET | `/v1/openapi.json` | OpenAPI 3.1 |

## Templates

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/templates` | List plus canvas, fonts, colors |
| GET | `/v1/templates/{id}` | Defaults, fields, JSON Schema |
| GET | `/v1/templates/{id}/schema` | JSON Schema only |

`{id}` is a template id (`template16`) or slug (`launch`).

## Designs

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/designs?limit=50` | Metadata only. Limit max 200. |
| POST | `/v1/designs` | Create from JSON |
| GET | `/v1/designs/{id}` | Full JSON |
| PATCH | `/v1/designs/{id}` | Merge onto stored design |
| PUT | `/v1/designs/{id}` | Rebuild from defaults, then apply body |
| DELETE | `/v1/designs/{id}` | Delete |

Ids are UUIDs. Body max 2MB.

Accepted bodies: `{ template, fields }`, native slices (`t16`, `style`, ...), or an `instatools-design` export from the maker.

## Render

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/v1/render` | One-shot JSON to PNG. Nothing stored. |
| POST | `/v1/designs/{id}/render` | Stored design to PNG |

Response `image/png` with `X-Instatools-Template`, `X-Instatools-Width`, `X-Instatools-Height`. Stored renders also send `X-Instatools-Design`.

## CORS

Any origin. Allowed headers: `Authorization`, `Content-Type`, `X-Admin-Token`, `Accept`.
