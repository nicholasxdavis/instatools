<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarketingShell from '@/components/marketing/MarketingShell.vue'
import CodeBlock from '@/components/marketing/CodeBlock.vue'
import { apiRequest, getSession, setSession } from '@/config/api'
import '@/assets/marketing.css'

const route = useRoute()
const router = useRouter()
const email = ref('')
const redeemCode = ref('')
const status = ref('')
const busy = ref(false)
const me = ref(null)
const revealedKey = ref('')
const checkoutNote = ref('')

const isPro = computed(() => me.value?.quota?.plan === 'pro')
const proUntilLabel = computed(() => {
  const raw = me.value?.quota?.proUntil || me.value?.app?.proUntil
  if (!raw) return ''
  const date = new Date(raw)
  if (!Number.isFinite(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
})

async function refresh() {
  const token = getSession()
  if (!token) {
    me.value = null
    return
  }
  try {
    me.value = await apiRequest('/v1/me')
  } catch {
    setSession('')
    me.value = null
  }
}

async function sendLink() {
  busy.value = true
  status.value = 'Sending login link...'
  try {
    const result = await apiRequest('/v1/auth/login', {
      method: 'POST',
      body: { email: email.value },
      token: '',
    })
    status.value = result.message || 'Check your email for a login link.'
  } catch (error) {
    status.value = error.message || 'Could not send the link.'
  } finally {
    busy.value = false
  }
}

async function exchange(loginToken) {
  busy.value = true
  status.value = 'Signing in...'
  try {
    const result = await apiRequest('/v1/auth/exchange', {
      method: 'POST',
      body: { token: loginToken },
      token: '',
    })
    setSession(result.session)
    if (result.key) revealedKey.value = result.key
    await refresh()
    status.value = result.key ? 'Signed in. Copy your API key now. We cannot show it again.' : 'Signed in.'
    const query = { ...route.query }
    delete query.login
    router.replace({ path: '/account', query })
  } catch (error) {
    status.value = error.message || 'Login link expired. Request a new one.'
  } finally {
    busy.value = false
  }
}

async function rotate() {
  busy.value = true
  try {
    const result = await apiRequest('/v1/me/keys', { method: 'POST' })
    revealedKey.value = result.key || ''
    status.value = 'New key issued. The previous key no longer works.'
    await refresh()
  } catch (error) {
    status.value = error.message || 'Could not rotate the key.'
  } finally {
    busy.value = false
  }
}

async function upgrade() {
  busy.value = true
  try {
    const result = await apiRequest('/v1/billing/checkout', { method: 'POST' })
    if (result.url) window.location.href = result.url
  } catch (error) {
    status.value = error.message || 'Could not start checkout.'
    busy.value = false
  }
}

async function portal() {
  busy.value = true
  try {
    const result = await apiRequest('/v1/billing/portal', { method: 'POST' })
    if (result.url) window.location.href = result.url
  } catch (error) {
    status.value = error.message || 'Could not open billing.'
    busy.value = false
  }
}

async function redeem() {
  busy.value = true
  status.value = 'Checking code...'
  try {
    const result = await apiRequest('/v1/me/redeem', {
      method: 'POST',
      body: { code: redeemCode.value },
    })
    me.value = {
      app: result.app,
      quota: result.quota,
    }
    redeemCode.value = ''
    status.value = result.message || 'Code redeemed.'
  } catch (error) {
    status.value = error.message || 'Could not redeem that code.'
  } finally {
    busy.value = false
  }
}

function signOut() {
  setSession('')
  me.value = null
  revealedKey.value = ''
  status.value = 'Signed out.'
}

async function destroy() {
  if (!window.confirm('Delete this account, keys, and designs? Pro will cancel.')) return
  busy.value = true
  try {
    await apiRequest('/v1/me', { method: 'DELETE' })
    signOut()
    status.value = 'Account deleted.'
  } catch (error) {
    status.value = error.message || 'Could not delete the account.'
    busy.value = false
  }
}

onMounted(async () => {
  if (route.query.checkout === 'success') {
    checkoutNote.value = 'Stripe checkout finished. Sign in with the same email to see Pro.'
  }
  const login = String(route.query.login || '')
  if (login) {
    await exchange(login)
    return
  }
  await refresh()
})
</script>

<template>
  <MarketingShell footer="mini">
    <main id="content" class="m-account">
      <p class="m-docs-kicker">Account</p>
      <h1>{{ me ? 'Your Instatools account' : 'Sign in with email.' }}</h1>
      <p class="m-docs-lead">
        We email a login link. No password. Manage Pro layouts, API keys, redeem codes, and billing from here.
      </p>
      <p v-if="checkoutNote" class="m-plan-status">{{ checkoutNote }}</p>

      <section v-if="!me" class="m-account-card">
        <form @submit.prevent="sendLink">
          <label>
            Email
            <input v-model="email" type="email" autocomplete="email" required placeholder="you@example.com" />
          </label>
          <button class="btn-try" type="submit" :disabled="busy">Email me a login link</button>
        </form>
        <p class="m-plan-note">New emails get a free key after you click the link. <router-link to="/pricing">See pricing</router-link>.</p>
        <p v-if="status" class="m-plan-status">{{ status }}</p>
      </section>

      <section v-else class="m-account-grid">
        <div class="m-account-card">
          <h2>{{ me.quota.planName }} plan</h2>
          <p class="m-account-email">{{ me.app.email }}</p>
          <div class="m-meter" :style="{ '--used': `${Math.min(100, (me.quota.rendersUsed / me.quota.rendersLimit) * 100)}%` }">
            <span>{{ me.quota.rendersUsed }} / {{ me.quota.rendersLimit }} renders this month</span>
          </div>
          <p class="m-plan-note">{{ me.quota.designsUsed }} / {{ me.quota.maxDesigns }} saved designs</p>
          <p class="m-plan-note">
            <template v-if="isPro && proUntilLabel">Pro layouts unlocked until {{ proUntilLabel }}.</template>
            <template v-else-if="isPro">Pro layouts unlocked in the editor and API.</template>
            <template v-else>Upgrade for Cutout Stack, Launch, Smoke Cutout, World Tape, and Match Tape.</template>
          </p>
          <div class="m-account-actions">
            <button v-if="!isPro" class="btn-try" type="button" :disabled="busy" @click="upgrade">Upgrade to Pro</button>
            <button v-else-if="me.app.proSource !== 'redeem'" class="btn-ghost" type="button" :disabled="busy" @click="portal">Manage billing</button>
            <button class="btn-ghost" type="button" @click="signOut">Sign out</button>
          </div>
        </div>

        <div class="m-account-card">
          <h2>Redeem code</h2>
          <p class="m-plan-note">Have a promo code? Redeem it here for one month of Pro. Each code works once.</p>
          <form class="m-plan-form" @submit.prevent="redeem">
            <label>
              Code
              <input
                v-model="redeemCode"
                type="text"
                autocomplete="off"
                spellcheck="false"
                required
                placeholder="XXXX-XXXX-XXXX"
              />
            </label>
            <button class="btn-try" type="submit" :disabled="busy || !redeemCode.trim()">Redeem</button>
          </form>
        </div>

        <div class="m-account-card">
          <h2>API key</h2>
          <p class="m-plan-note">Use this in your app. We hash it at rest, so rotate when you need to see a value again.</p>
          <CodeBlock v-if="revealedKey" :code="revealedKey" />
          <div class="m-account-actions">
            <button class="btn-ghost" type="button" :disabled="busy" @click="rotate">{{ revealedKey ? 'Rotate key' : 'Show a new key' }}</button>
          </div>
        </div>

        <div class="m-account-card">
          <h2>Danger</h2>
          <p class="m-plan-note">Deletes designs, revokes keys, and cancels Pro.</p>
          <button class="btn-ghost" type="button" :disabled="busy" @click="destroy">Delete account</button>
        </div>
        <p v-if="status" class="m-plan-status">{{ status }}</p>
      </section>
    </main>
  </MarketingShell>
</template>
