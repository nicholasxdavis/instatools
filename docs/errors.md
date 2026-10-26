# Errors

JSON errors look like:

```json
{
  "error": "unauthorized",
  "message": "Invalid API key."
}
```

| Status | error | When |
| --- | --- | --- |
| 400 | invalid_json | Body is not a JSON object |
| 400 | invalid_email | Signup email is missing or invalid |
| 400 | missing_template | No template id or slug |
| 400 | invalid_design | Slice or style object missing |
| 400 | invalid_id | Design id is not a UUID |
| 400 | invalid_name | App name empty |
| 400 | no_subscription | Billing portal requested before Pro checkout |
| 401 | unauthorized | Bad or missing key, admin token, or Stripe signature |
| 404 | unknown_template | Id or slug not found |
| 404 | not_found | Design or route missing |
| 413 | payload_too_large | Over 2MB |
| 429 | quota_exceeded | Render or saved-design cap hit |
| 429 | rate_limited | Signup or other abuse cap |
| 500 | render_failed | Browser screenshot failed |
| 500 | internal_error | Unexpected failure |
| 502 | mail_failed | Could not send the key email |
| 503 | mail_unconfigured | Email provider is not set |
| 503 | billing_unconfigured | Stripe is not set |

`GET /v1/health` is the public liveness check. See [Reference](reference.md) for the full route list.
