# Get a key

Anyone can get a key. Enter your email. We send the key from Blacnova Development (`nic@blacnova.net`).

The key is shown only in that email. If you request again, we send a new key and revoke the old one.

<form class="docs-form" id="signup-form">
  <label>
    Email
    <input type="email" name="email" autocomplete="email" required placeholder="you@example.com" />
  </label>
  <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="display:none" />
  <button type="submit">Email my key</button>
  <p class="status" id="signup-status"></p>
</form>

Or use the [signup page](https://www.useinstatools.com/signup/).

## From curl

```bash
curl -X POST https://instatools-api.nic-58f.workers.dev/v1/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"you@example.com\"}"
```

The HTTP response never includes the key. Check your inbox (and spam).

<script>
(function () {
  var form = document.getElementById('signup-form')
  if (!form) return
  var status = document.getElementById('signup-status')
  form.addEventListener('submit', function (event) {
    event.preventDefault()
    status.textContent = 'Sending...'
    fetch('https://instatools-api.nic-58f.workers.dev/v1/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email.value,
        website: form.website.value,
      }),
    })
      .then(function (response) { return response.json().then(function (body) { return { ok: response.ok, body: body } }) })
      .then(function (result) {
        status.textContent = result.body.message || (result.ok ? 'Check your email.' : 'Could not send the key.')
      })
      .catch(function () {
        status.textContent = 'Could not reach the API. Try again.'
      })
  })
})()
</script>
