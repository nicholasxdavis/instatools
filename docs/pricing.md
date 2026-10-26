# Pricing

The maker on the website stays free. These limits are for the HTTP API only.

| | Free | Pro |
| --- | --- | --- |
| Price | $0 | $19 / month |
| PNG renders | 50 / month | 2,000 / month |
| Saved designs | 25 | 500 |
| Layouts | All 17 | All 17 |
| Signup | Email | Email, then checkout |

Renders reset on the 1st of each UTC month. Stored designs stay until you delete them.

## Cancel

Pro renews monthly until you cancel. Open the billing portal with your API key. Cancel takes effect at the end of the paid period. You keep Pro quota until then, then the key returns to Free.

Stripe emails the cardholder if a renewal fails.

## Refunds

We do not prorate unused renders. If a charge looks wrong, email [nic@blacnova.net](mailto:nic@blacnova.net) within 14 days. Full terms: [useinstatools.com/terms](https://www.useinstatools.com/terms).

## Delete the API account

```bash
curl -X DELETE https://instatools-api.nic-58f.workers.dev/v1/me \
  -H "Authorization: Bearer itk_your_key"
```

That revokes the key, deletes stored designs, and cancels an open Pro subscription.

## Upgrade

1. [Get a key](get-a-key.md) if you do not have one.
2. Paste the key below. We send you to Stripe Checkout.
3. Manage or cancel later through the Stripe portal.

<form class="docs-form" id="upgrade-form">
  <label>
    API key
    <input type="password" name="key" autocomplete="off" required placeholder="itk_..." />
  </label>
  <button type="submit">Upgrade to Pro</button>
  <p class="status" id="upgrade-status"></p>
</form>

<form class="docs-form" id="portal-form">
  <label>
    API key
    <input type="password" name="key" autocomplete="off" required placeholder="itk_..." />
  </label>
  <button type="submit">Open billing portal</button>
  <p class="status" id="portal-status"></p>
</form>

Check remaining quota:

```bash
curl https://instatools-api.nic-58f.workers.dev/v1/me \
  -H "Authorization: Bearer itk_your_key"
```

<script>
(function () {
  function post(path, key, status) {
    status.textContent = 'Opening Stripe...'
    fetch('https://instatools-api.nic-58f.workers.dev' + path, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key },
    })
      .then(function (response) { return response.json().then(function (body) { return { ok: response.ok, body: body } }) })
      .then(function (result) {
        if (result.body.url) {
          window.location.href = result.body.url
          return
        }
        status.textContent = result.body.message || 'Could not start billing.'
      })
      .catch(function () {
        status.textContent = 'Could not reach the API. Try again.'
      })
  }
  var upgrade = document.getElementById('upgrade-form')
  if (upgrade) {
    upgrade.addEventListener('submit', function (event) {
      event.preventDefault()
      post('/v1/billing/checkout', upgrade.key.value, document.getElementById('upgrade-status'))
    })
  }
  var portal = document.getElementById('portal-form')
  if (portal) {
    portal.addEventListener('submit', function (event) {
      event.preventDefault()
      post('/v1/billing/portal', portal.key.value, document.getElementById('portal-status'))
    })
  }
  var params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '')
  if (params.get('checkout') === 'success') {
    var box = document.getElementById('upgrade-status')
    if (box) box.textContent = 'Pro is on. New renders use the higher quota.'
  }
})()
</script>
