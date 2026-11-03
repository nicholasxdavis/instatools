<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarketingShell from '@/components/marketing/MarketingShell.vue'
import CodeBlock from '@/components/marketing/CodeBlock.vue'
import { DOC_PAGES, DOCS_API, docBySlug } from '@/docs/content'
import { THEME_CATALOG } from '@/seo/catalog'
import '@/assets/marketing.css'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug || ''))
const known = computed(() => DOC_PAGES.some((entry) => entry.slug === slug.value))
const page = computed(() => docBySlug(slug.value))

const exampleRender = computed(
  () => `curl ${DOCS_API}/v1/render \\
  -H "Authorization: Bearer itk_your_key" \\
  -H "Content-Type: application/json" \\
  --output post.png \\
  -d '{"template":"launch","fields":{"headline":"Hello from the API"}}'`,
)

const quickstartHealth = computed(
  () => `curl ${DOCS_API}/v1/health

curl ${DOCS_API}/v1/me \\
  -H "Authorization: Bearer itk_your_key"

curl ${DOCS_API}/v1/templates/launch \\
  -H "Authorization: Bearer itk_your_key"`,
)

const quickstartCreate = computed(
  () => `curl -X POST ${DOCS_API}/v1/designs \\
  -H "Authorization: Bearer itk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"template":"launch","fields":{"headline":"Ship it"}}'`,
)

const authHeader = 'Authorization: Bearer itk_...'

const authRotate = computed(
  () => `curl -X POST ${DOCS_API}/v1/me/keys \\
  -H "Authorization: Bearer itk_old_key"`,
)

const templatesList = computed(
  () => `curl ${DOCS_API}/v1/templates
curl ${DOCS_API}/v1/templates/launch`,
)

const designBody = `{
  "template": "launch",
  "fields": { "headline": "Ship it", "buttonText": "Try now" }
}`

const designSame = `{ "template": "news-classic", "headline": "Breaking", "caption": "Local" }

{ "template": "template1", "settings": { "headline": "Breaking" } }`

const errorBody = `{ "error": "unauthorized", "message": "Invalid API key." }`

function absorbLegacyHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  if (!raw) return
  if (raw.startsWith('pricing')) {
    router.replace('/pricing')
    return
  }
  if (raw.startsWith('get-a-key') || raw.startsWith('signup')) {
    router.replace('/account')
    return
  }
  const match = DOC_PAGES.find((entry) => entry.slug && (raw === entry.slug || raw.startsWith(`${entry.slug}.`)))
  if (match) router.replace(`/docs/${match.slug}`)
}

onMounted(absorbLegacyHash)

watch(
  () => slug.value,
  (next) => {
    if (next === 'pricing') router.replace('/pricing')
    else if (next === 'get-a-key' || next === 'signup') router.replace('/account')
    else if (next && !known.value) router.replace('/docs')
  },
  { immediate: true },
)
</script>

<template>
  <MarketingShell footer="mini">
    <main id="content" class="m-docs">
      <aside class="m-docs-side">
        <p class="m-docs-kicker">API</p>
        <nav aria-label="Docs">
          <router-link to="/docs" :class="{ active: slug === '' }">Overview</router-link>
          <router-link
            v-for="item in DOC_PAGES.filter((entry) => entry.slug)"
            :key="item.slug"
            :to="`/docs/${item.slug}`"
            :class="{ active: slug === item.slug }"
          >
            {{ item.title }}
          </router-link>
        </nav>
      </aside>

      <article class="m-docs-article">
        <p class="m-docs-kicker">{{ page.title }}</p>
        <h1>{{ page.heading }}</h1>
        <p class="m-docs-lead">{{ page.lead }}</p>

        <div class="m-docs-cta">
          <router-link class="btn-try" to="/account">Open account</router-link>
          <router-link class="btn-ghost" to="/pricing">See pricing</router-link>
        </div>

        <template v-if="slug === ''">
          <div class="m-docs-cards">
            <div class="m-docs-card">
              <h2>Base URL</h2>
              <CodeBlock :code="DOCS_API" />
              <p>App calls send <code>Authorization: Bearer itk_...</code>. The dashboard uses a login link. You do not paste a key to buy Pro.</p>
            </div>
            <div class="m-docs-card">
              <h2>What you can do</h2>
              <ol class="m-docs-steps">
                <li>Open an account with your email.</li>
                <li>Copy the API key from the dashboard.</li>
                <li>Create a design as JSON and render PNG.</li>
              </ol>
            </div>
          </div>
          <h2>Example</h2>
          <CodeBlock :code="exampleRender" />
        </template>

        <template v-else-if="slug === 'quickstart'">
          <ol class="m-docs-steps">
            <li><router-link to="/account">Open your account</router-link> with an email. We send a login link.</li>
            <li>Copy the API key from the dashboard.</li>
            <li>Confirm health, then render.</li>
          </ol>
          <CodeBlock :code="quickstartHealth" />
          <h2>Create then render</h2>
          <CodeBlock :code="quickstartCreate" />
        </template>

        <template v-else-if="slug === 'auth'">
          <p>API keys look like <code>itk_</code> plus random bytes. We hash them at rest. The dashboard never needs you to paste a key to upgrade or cancel.</p>
          <h2>App calls</h2>
          <CodeBlock :code="authHeader" />
          <h2>Rotate</h2>
          <p>Use the dashboard, or:</p>
          <CodeBlock :code="authRotate" />
        </template>

        <template v-else-if="slug === 'templates'">
          <p>Catalog is public. No API key. Use a slug or an id. Templates marked <code>pro: true</code> need a Pro plan to render.</p>
          <CodeBlock :code="templatesList" />
          <p>Every premade layout:</p>
          <div class="m-docs-table-wrap">
            <table class="m-docs-table">
              <thead>
                <tr><th>Name</th><th>Slug</th><th>Id</th></tr>
              </thead>
              <tbody>
                <tr v-for="theme in THEME_CATALOG" :key="theme.id">
                  <td>{{ theme.name }}{{ theme.pro ? ' (Pro)' : '' }}</td>
                  <td><code>{{ theme.slug }}</code></td>
                  <td><code>{{ theme.id }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>Detail payload includes <code>defaults</code>, <code>fields</code>, and <code>jsonSchema</code>. Canvas is 1080x1350 except square layouts (tweet, World Tape, Match Tape), which are 1080x1080.</p>
          <p>Custom settings use the field paths from that payload. Send them as <code>fields</code>, <code>settings</code>, or top-level keys.</p>
        </template>

        <template v-else-if="slug === 'designs'">
          <p>Scoped to your account. Body max 2MB. Free stores 25. Pro stores 500. Any of the 17 layouts. Custom field values. Or a full editor export.</p>
          <CodeBlock :code="designBody" />
          <p>These are the same:</p>
          <CodeBlock :code="designSame" />
          <p>PATCH merges. PUT rebuilds from defaults. You can also send an Instatools export of type <code>instatools-design</code>.</p>
        </template>

        <template v-else-if="slug === 'render'">
          <p><code>POST /v1/render</code> is one-shot. <code>POST /v1/designs/{id}/render</code> uses a stored design. Response is <code>image/png</code>.</p>
          <p>Image URLs in JSON must be publicly fetchable. Successful renders count against the monthly cap. Failed renders do not.</p>
        </template>

        <template v-else-if="slug === 'limits'">
          <div class="m-plan-row">
            <div class="m-plan-card">
              <h3>Free</h3>
              <p class="m-plan-price">$0</p>
              <ul>
                <li>50 PNG renders / month</li>
                <li>25 saved designs</li>
                <li>Free layouts only</li>
              </ul>
            </div>
            <div class="m-plan-card m-plan-card-pro">
              <h3>Pro</h3>
              <p class="m-plan-price">$19 / month</p>
              <ul>
                <li>2,000 PNG renders / month</li>
                <li>500 saved designs</li>
                <li>Pro layouts: Cutout Stack, Launch, Smoke Cutout, World Tape, Match Tape</li>
              </ul>
              <router-link class="btn-try" to="/pricing">Get Pro</router-link>
            </div>
          </div>
        </template>

        <template v-else-if="slug === 'reference'">
          <p>Public, no key: <code>GET /v1/health</code>, <code>GET /v1/templates</code>, <code>GET /v1/templates/{id}</code>, <code>GET /v1/openapi.json</code>, <code>POST /v1/auth/login</code>, <code>POST /v1/billing/checkout-email</code>.</p>
          <p>With a key or account session: designs, render, <code>GET /v1/me</code>, billing portal, <code>DELETE /v1/me</code>.</p>
          <p>Any app can call this. CORS is open. Catalog is public. Render needs a Bearer token.</p>
        </template>

        <template v-else-if="slug === 'errors'">
          <CodeBlock :code="errorBody" />
          <p>Common codes: <code>unauthorized</code>, <code>quota_exceeded</code>, <code>rate_limited</code>, <code>render_failed</code>, <code>invalid_email</code>.</p>
        </template>
      </article>
    </main>
  </MarketingShell>
</template>
