<script setup>
import { useIconPattern } from '@/composables/useIconPattern'
import { publicUrl } from '@/utils/publicUrl'

const props = defineProps({
  footer: { type: String, default: 'full' },
  icons: { type: Boolean, default: false },
})

const { iconLayer } = useIconPattern()
const year = new Date().getFullYear()
const logoSrc = publicUrl('logo.png')
</script>

<template>
  <div class="marketing" :class="{ 'marketing-home': props.icons, 'marketing-page': !props.icons }">
    <div v-if="props.icons" ref="iconLayer" class="icon-pattern-bg" aria-hidden="true" />
    <a class="m-skip" href="#content">Skip to content</a>

    <header class="m-nav" aria-label="Primary">
      <router-link class="m-nav-logo" to="/" aria-label="Instatools home">
        <img :src="logoSrc" width="120" height="44" alt="Instatools" decoding="async" />
      </router-link>
      <nav class="m-nav-center" aria-label="Page">
        <a href="/#templates">Layouts</a>
        <a href="/#api">API</a>
        <a href="/#faq">FAQ</a>
        <router-link to="/docs">Docs</router-link>
        <router-link to="/pricing">Pricing</router-link>
      </nav>
      <div class="m-nav-actions">
        <router-link class="m-support" to="/account">Account</router-link>
        <router-link class="btn-try" to="/make">Try now</router-link>
      </div>
      <nav class="m-nav-mobile-api" aria-label="Page">
        <a href="/#templates">Layouts</a>
        <a href="/#api">API</a>
        <a href="/#faq">FAQ</a>
        <router-link to="/docs">Docs</router-link>
        <router-link to="/pricing">Pricing</router-link>
        <router-link to="/account">Account</router-link>
      </nav>
    </header>

    <div class="m-body">
      <slot />
    </div>

    <footer class="m-footer" :class="{ 'm-footer-mini': footer === 'mini' }">
      <template v-if="footer === 'full'">
        <h2>
          Built for Instagram,
          <br />
          <span class="m-footer-grad">ready to post.</span>
        </h2>
        <router-link class="btn-try btn-try-lg" to="/make">Try now</router-link>
      </template>
      <nav class="m-footer-links" aria-label="Footer">
        <router-link to="/">Homepage</router-link>
        <router-link to="/docs">Docs</router-link>
        <router-link to="/pricing">Pricing</router-link>
        <router-link to="/account">Account</router-link>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="https://github.com/nicholasxdavis/instatools" target="_blank" rel="noopener noreferrer">GitHub</a>
        <router-link to="/make">Try now</router-link>
        <a href="https://buymeacoffee.com/galore" target="_blank" rel="noopener noreferrer">Support Us</a>
      </nav>
      <p class="m-copy">
        © {{ year }} Instatools by
        <a href="https://www.blacnova.net" target="_blank" rel="noopener noreferrer">Blacnova Development</a>
      </p>
    </footer>
  </div>
</template>
