<script setup>
import MarketingShell from '@/components/marketing/MarketingShell.vue'
import { HOME_PAGE } from '@/seo/catalog'
import { THEME_CARDS, themePath } from '@/themes/cards'
import '@/assets/marketing.css'

const faqs = HOME_PAGE.faqs

function blurb(theme) {
  const text = theme.description || ''
  const cut = text.split('. ')[0]
  return cut.endsWith('.') ? cut : `${cut}.`
}
</script>

<template>
  <MarketingShell icons>
    <main id="content">
      <section class="m-hero" aria-labelledby="marketing-title">
        <h1 id="marketing-title">
          Free Instagram
          <br />
          posts for
          <span class="m-hero-mark">creators.</span>
        </h1>
        <p class="m-lead">{{ HOME_PAGE.lead }}</p>
        <p class="m-trust">No AI · No signup · Your photos stay on your device</p>
        <div class="m-hero-actions">
          <router-link class="m-hero-btn m-hero-btn-primary" to="/make">Try now</router-link>
          <a class="m-hero-btn m-hero-btn-secondary" href="#templates">Browse layouts</a>
        </div>
      </section>

      <section id="templates" class="m-templates" aria-labelledby="templates-title">
        <div class="m-templates-shell">
          <div class="m-templates-head">
            <h2 id="templates-title">Layouts ready to post.</h2>
            <p>
              {{ THEME_CARDS.length }} Instagram layouts for news, sports, finance, tweets, fashion, campaigns, and more. Open one, edit it, export HD on your device.
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

      <section id="api" class="m-api" aria-labelledby="api-title">
        <div class="m-api-shell">
          <p class="m-docs-kicker">API</p>
          <h2 id="api-title">Same layouts over the API.</h2>
          <p>JSON in. PNG out. Any app can list the catalog. Email login. Buy Pro without pasting a key. Instatools in the browser stays free and local.</p>
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
