<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import MarketingShell from '@/components/marketing/MarketingShell.vue'
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
      <h1>API plans. Instatools stays free.</h1>
      <p class="m-docs-lead">
        Buy Pro with an email. No API key to paste. Cancel in your account when you want.
      </p>

      <div class="m-plan-row">
        <div class="m-plan-card">
          <h2>Free</h2>
          <p class="m-plan-price">$0</p>
          <ul>
            <li>50 PNG renders per month</li>
            <li>25 saved designs</li>
            <li>All 17 layouts</li>
            <li>Email account</li>
          </ul>
          <router-link class="btn-ghost" to="/account">Get a free key</router-link>
        </div>
        <div class="m-plan-card m-plan-card-pro">
          <h2>Pro</h2>
          <p class="m-plan-price">$19<span> / month</span></p>
          <ul>
            <li>2,000 PNG renders per month</li>
            <li>500 saved designs</li>
            <li>Stripe invoices</li>
            <li>Cancel at period end</li>
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
