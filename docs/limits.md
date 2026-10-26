# Limits

| | Free | Pro |
| --- | --- | --- |
| PNG renders | 50 / UTC month | 2,000 / UTC month |
| Saved designs | 25 | 500 |
| JSON body | 2 MB | 2 MB |
| Signup | 3 emails / day, 8 / IP / hour | same |

Over quota returns `429` with `{ "error": "quota_exceeded" }` and the current `details` snapshot.

Renders are counted after a successful PNG. Failed renders are not billed.

`GET /v1/me` shows `rendersUsed`, `rendersLimit`, and `rendersRemaining`.

Upgrade and cancel: [Pricing](pricing.md).
