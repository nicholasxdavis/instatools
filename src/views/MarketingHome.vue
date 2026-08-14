<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { HOME_PAGE } from '@/seo/catalog'
import { THEMES, themePath } from '@/themes'
import '@/assets/marketing.css'

const iconLayer = ref(null)
let resizeTimer = 0
const year = new Date().getFullYear()
const faqs = HOME_PAGE.faqs

function blurb(theme) {
  const text = theme.description || ''
  const cut = text.split('. ')[0]
  return cut.endsWith('.') ? cut : `${cut}.`
}

function paintIcons() {
  const layer = iconLayer.value
  if (!layer) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    layer.innerHTML = ''
    return
  }

  const iconPaths = [
    '/iconarmy/camera-svgrepo-com.svg',
    '/iconarmy/favorite-svgrepo-com.svg',
    '/iconarmy/flash-svgrepo-com.svg',
    '/iconarmy/instagram-167-svgrepo-com.svg',
    '/iconarmy/tools-svgrepo-com.svg',
  ]
  const random = (min, max) => Math.random() * (max - min) + min
  layer.innerHTML = ''
  const cellSize = 220
  const cols = Math.ceil(window.innerWidth / cellSize)
  const rows = Math.ceil(Math.min(window.innerHeight, 900) / cellSize)
  const fragment = document.createDocumentFragment()

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (Math.random() < 0.28) continue
      const icon = document.createElement('span')
      const size = random(96, 128)
      const x = (col + 0.5) * cellSize + random(-28, 28)
      const y = (row + 0.5) * cellSize + random(-28, 28)
      icon.className = 'icon-pattern-item'
      icon.style.left = `${x - size / 2}px`
      icon.style.top = `${y - size / 2}px`
      icon.style.width = `${size}px`
      icon.style.height = `${size}px`
      icon.style.opacity = random(0.05, 0.1).toFixed(3)
      icon.style.transform = `rotate(${random(-24, 24).toFixed(1)}deg)`
      icon.style.backgroundImage = `url("${iconPaths[(row * cols + col) % iconPaths.length]}")`
      fragment.appendChild(icon)
    }
  }
  layer.appendChild(fragment)
}

function onResize() {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(paintIcons, 160)
}

onMounted(() => {
  paintIcons()
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.clearTimeout(resizeTimer)
})
</script>

<template>
  <div class="marketing">
    <div ref="iconLayer" class="icon-pattern-bg" aria-hidden="true" />

    <a class="m-skip" href="#content">Skip to content</a>

    <header class="m-nav" aria-label="Primary">
      <router-link class="m-nav-logo" to="/" aria-label="Instatools home">
        <img src="/logo.png" width="120" height="44" alt="Instatools" decoding="async" />
      </router-link>
      <nav class="m-nav-center" aria-label="Page">
        <a href="#templates">Layouts</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div class="m-nav-actions">
        <router-link class="btn-try" to="/app">Try now</router-link>
        <a
          class="m-support"
          href="https://buymeacoffee.com/galore"
          target="_blank"
          rel="noopener noreferrer"
        >
          Support Us
        </a>
      </div>
    </header>

    <main id="content">
      <section class="m-hero" aria-labelledby="marketing-title">
        <h1 id="marketing-title">
          Free Instagram
          <br />
          Post Maker for
          <span class="m-hero-mark">creators.</span>
        </h1>
        <p class="m-lead">{{ HOME_PAGE.lead }}</p>
        <div class="m-hero-actions">
          <router-link class="btn-try btn-try-lg" to="/app">Try now</router-link>
          <a class="btn-ghost" href="#templates">Browse layouts</a>
        </div>
      </section>

      <section id="templates" class="m-templates" aria-labelledby="templates-title">
        <div class="m-templates-shell">
          <div class="m-templates-head">
            <h2 id="templates-title">Layouts ready to post.</h2>
            <p>
              Fourteen Instagram layouts for news, sports, finance, tweets, fashion, and more. Open one, edit it, export HD on your device.
            </p>
          </div>
          <div class="m-grid">
            <router-link
              v-for="(theme, index) in THEMES"
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

    <footer class="m-footer">
      <h2>
        Built for creators,
        <br />
        <span class="m-footer-grad">open for everyone.</span>
      </h2>
      <router-link class="btn-try btn-try-lg" to="/app">Try now</router-link>
      <nav class="m-footer-links" aria-label="Footer">
        <a href="https://buymeacoffee.com/galore" target="_blank" rel="noopener noreferrer">Support Us</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="https://github.com/nicholasxdavis/instatools" target="_blank" rel="noopener noreferrer">GitHub</a>
        <router-link to="/app">Open maker</router-link>
      </nav>
      <p class="m-copy">
        © {{ year }} Instatools by
        <a href="https://www.blacnova.net" target="_blank" rel="noopener noreferrer">Blacnova Development</a>
      </p>
    </footer>
  </div>
</template>
