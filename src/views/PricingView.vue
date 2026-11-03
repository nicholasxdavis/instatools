<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import MarketingShell from '@/components/marketing/MarketingShell.vue'
import { FREE_THEME_COUNT, PRO_THEME_COUNT, THEME_COUNT } from '@/seo/catalog'
import { apiRequest } from '@/config/api'
import '@/assets/marketing.css'

const route = useRoute()
const email = ref('')
const status = ref('')
const busy = ref(false)

onMounted(() => {
  if (route.query.checkout === 'cancel') status.value = 'Checkout canceled. You can try again whenever you want.'
})

async function startCheckout() {
  busy.value = true
  status.value = 'Opening Stripe...'
  try {
    const result = await apiRequest('/v1/billing/checkout-email', {
      method: 'POST',
      body: { email: email.value },
      token: '',
    })
    if (result.url) {
      window.location.href = result.url
      return
    }
    status.value = result.message || 'Could not start checkout.'
  } catch (error) {
    status.value = error.message || 'Could not start checkout.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <MarketingShell footer="mini">
    <main id="content" class="m-pricing">
      <p class="m-docs-kicker">Pricing</p>
      <h1>Free layouts. Pro unlocks more.</h1>
      <p class="m-docs-lead">
        Most of the editor stays free. Pro adds {{ PRO_THEME_COUNT }} premium layouts and a bigger API quota. Buy with an email. Cancel in your account.
      </p>

      <div class="m-plan-row">
        <div class="m-plan-card">
          <h2>Free</h2>
          <p class="m-plan-price">$0</p>
          <ul>
            <li>{{ FREE_THEME_COUNT }} free layouts in the browser</li>
            <li>Local HD PNG export</li>
            <li>50 API PNG renders / month</li>
            <li>25 saved API designs</li>
          </ul>
          <router-link class="btn-ghost" to="/account">Open account</router-link>
        </div>
        <div class="m-plan-card m-plan-card-pro">
          <h2>Pro</h2>
          <p class="m-plan-price">$19<span> / month</span></p>
          <ul>
            <li>All {{ THEME_COUNT }} layouts, including {{ PRO_THEME_COUNT }} Pro layouts</li>
            <li>Cutout Stack, Launch, Smoke Cutout, World Tape, Match Tape</li>
            <li>2,000 API PNG renders / month</li>
            <li>500 saved API designs</li>
          </ul>
          <form class="m-plan-form" @submit.prevent="startCheckout">
            <label>
              Email
              <input v-model="email" type="email" autocomplete="email" required placeholder="you@example.com" />
            </label>
            <button class="btn-try" type="submit" :disabled="busy">Continue to Stripe</button>
            <p class="m-plan-note">
              You agree to the <a href="/terms">terms</a> and <a href="/privacy">privacy policy</a>.
            </p>
            <p v-if="status" class="m-plan-status">{{ status }}</p>
          </form>
        </div>
      </div>

      <p class="m-pricing-foot">
        Already paying? <router-link to="/account">Open your account</router-link> to manage or cancel.
      </p>
    </main>
  </MarketingShell>
</template>
