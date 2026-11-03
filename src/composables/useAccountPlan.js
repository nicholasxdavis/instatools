import { computed, onMounted, ref } from 'vue'
import { apiRequest, getSession } from '@/config/api'
import { isProTheme } from '@/seo/catalog'

const plan = ref('free')
const email = ref('')
const proUntil = ref('')
const loaded = ref(false)
const loading = ref(false)
let inflight = null

async function refreshPlan(force = false) {
  if (loading.value && inflight) return inflight
  if (loaded.value && !force) return plan.value
  const token = getSession()
  if (!token) {
    plan.value = 'free'
    email.value = ''
    proUntil.value = ''
    loaded.value = true
    return plan.value
  }
  loading.value = true
  inflight = (async () => {
    try {
      const me = await apiRequest('/v1/me')
      plan.value = me?.quota?.plan === 'pro' || me?.app?.plan === 'pro' ? 'pro' : 'free'
      email.value = me?.app?.email || ''
      proUntil.value = me?.quota?.proUntil || me?.app?.proUntil || ''
    } catch {
      plan.value = 'free'
      email.value = ''
      proUntil.value = ''
    } finally {
      loaded.value = true
      loading.value = false
      inflight = null
    }
    return plan.value
  })()
  return inflight
}

export function useAccountPlan() {
  onMounted(() => {
    refreshPlan()
  })

  const isPro = computed(() => plan.value === 'pro')

  function canExportTheme(themeOrId) {
    if (!isProTheme(themeOrId)) return true
    return isPro.value
  }

  return {
    plan,
    email,
    proUntil,
    loaded,
    loading,
    isPro,
    refreshPlan,
    canExportTheme,
    isProTheme,
  }
}
