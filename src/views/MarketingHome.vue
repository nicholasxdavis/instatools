<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { PhGithubLogo } from '@phosphor-icons/vue/compact'
import MarketingShell from '@/components/marketing/MarketingShell.vue'
import { FREE_THEME_COUNT, HOME_PAGE, PRO_THEME_COUNT, THEME_COUNT } from '@/seo/catalog'
import { THEME_CARDS, themePath } from '@/themes/cards'
import '@/assets/marketing.css'

const faqs = HOME_PAGE.faqs
const bmcHost = ref(null)
let bmcScript = null

function blurb(theme) {
  const text = theme.description || ''
  const cut = text.split('. ')[0]
  return cut.endsWith('.') ? cut : `${cut}.`
}

onMounted(() => {
  if (!bmcHost.value || bmcHost.value.querySelector('script[data-name="bmc-button"]')) return
  bmcScript = document.createElement('script')
  bmcScript.type = 'text/javascript'
  bmcScript.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js'
  bmcScript.dataset.name = 'bmc-button'
  bmcScript.dataset.slug = 'galore'
  bmcScript.dataset.color = '#FFDD00'
  bmcScript.dataset.emoji = '☕'
  bmcScript.dataset.font = 'Lato'
  bmcScript.dataset.text = 'Buy me a coffee'
  bmcScript.dataset.outlineColor = '#000000'
  bmcScript.dataset.fontColor = '#000000'
  bmcScript.dataset.coffeeColor = '#ffffff'
  bmcHost.value.appendChild(bmcScript)
})

onBeforeUnmount(() => {
  bmcScript?.remove()
  bmcScript = null
})
</script>

<template>
  <MarketingShell icons>
    <main id="content">
      <section class="m-hero" aria-labelledby="marketing-title">
        <h1 id="marketing-title">
          Make Instagram
          <br />
          posts that
          <span class="m-hero-mark">stand out.</span>
        </h1>
        <p class="m-lead">{{ HOME_PAGE.lead }}</p>
        <p class="m-trust">Free · No signup · No AI · Files stay on your device</p>
        <div class="m-hero-actions">
          <router-link class="m-hero-btn m-hero-btn-primary" to="/make">Try now</router-link>
          <a class="m-hero-btn m-hero-btn-secondary" href="#templates">Browse layouts</a>
        </div>
        <div class="m-badges" aria-label="Community links">
          <a
            class="m-badge-ph"
            href="https://www.producthunt.com/products/instatools-for-instagram-posts?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-instatools-for-instagram-posts"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              alt="Instatools for Instagram Posts - Canva alternative for Instagram creators, Create posts easy. | Product Hunt"
              width="250"
              height="54"
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1302268&theme=light&t=1793666359034"
              loading="lazy"
              decoding="async"
            />
          </a>
          <a
            class="m-badge-github"
            href="https://github.com/nicholasxdavis/instatools"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instatools on GitHub"
          >
            <PhGithubLogo :size="28" weight="fill" aria-hidden="true" />
            <span>GitHub</span>
          </a>
          <div ref="bmcHost" class="m-badge-bmc" />
        </div>
      </section>

      <section id="templates" class="m-templates" aria-labelledby="templates-title">
        <div class="m-templates-shell">
          <div class="m-templates-head">
            <h2 id="templates-title">Layouts ready to post.</h2>
            <p>
              {{ THEME_COUNT }} Instagram layouts for news, sports, finance, tweets, fashion, and more.
              {{ FREE_THEME_COUNT }} are free. {{ PRO_THEME_COUNT }} Pro layouts unlock with Pro.
            </p>
          </div>
          <div class="m-grid">
            <router-link
              v-for="(theme, index) in THEME_CARDS"
              :key="theme.id"
              class="m-card"
              :to="themePath(theme)"
            >
              <div class="m-card-thumb">
                <span v-if="theme.pro" class="m-pro-badge">Pro</span>
                <picture>
                  <source :srcset="theme.cardImage" type="image/webp" />
                  <img
                    :src="theme.cardImageFallback"
                    :alt="`${theme.name} Instagram layout preview`"
                    width="480"
                    height="600"
                    :loading="index < 2 ? 'eager' : 'lazy'"
                    :fetchpriority="index === 0 ? 'high' : undefined"
                    decoding="async"
                  />
                </picture>
              </div>
              <h3>{{ theme.name }}</h3>
              <p>{{ blurb(theme) }}</p>
            </router-link>
          </div>
        </div>
      </section>

      <section id="why" class="m-why" aria-labelledby="why-title">
        <div class="m-why-shell">
          <h2 id="why-title">A Canva alternative built for Instagram.</h2>
          <p>
            Skip the blank page. Instatools is an Instagram post maker with ready layouts for news, sports, tweets, fashion, and ads.
            Drop in your photo, tune the headline, and export HD PNG in your browser.
          </p>
        </div>
      </section>

      <section id="api" class="m-api" aria-labelledby="api-title">
        <div class="m-api-shell">
          <p class="m-docs-kicker">Instatools Pro</p>
          <h2 id="api-title">Pro unlocks layouts and the API.</h2>
          <p>
            Free layouts stay free in the browser. Pro adds Cutout Stack, Launch, Smoke Cutout, World Tape, and Match Tape, plus higher API render limits. JSON in. PNG out.
          </p>
          <div class="m-api-actions">
            <router-link class="m-hero-btn m-hero-btn-primary" to="/account">Open account</router-link>
            <router-link class="m-hero-btn m-hero-btn-secondary" to="/docs">Read the docs</router-link>
            <router-link class="m-hero-btn m-hero-btn-secondary" to="/pricing">Pricing</router-link>
          </div>
        </div>
      </section>

      <section id="faq" class="m-faq" aria-labelledby="faq-title">
        <div class="m-faq-shell">
          <h2 id="faq-title">Frequently asked questions</h2>
          <div class="m-faq-list">
            <details v-for="faq in faqs" :key="faq.question" class="m-faq-item">
              <summary>{{ faq.question }}</summary>
              <p>{{ faq.answer }}</p>
            </details>
          </div>
        </div>
      </section>
    </main>
  </MarketingShell>
</template>
