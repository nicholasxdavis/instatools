import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { loadDesignFonts } from './seo/fonts'
import { WEB_ANALYTICS } from './seo/analytics'
import './assets/main.css'

function ensureAnalytics() {
  if (!WEB_ANALYTICS.token || document.querySelector('script[data-cf-beacon]')) return
  const script = document.createElement('script')
  script.defer = true
  script.src = WEB_ANALYTICS.src
  script.setAttribute('data-cf-beacon', JSON.stringify({ token: WEB_ANALYTICS.token, spa: true }))
  document.body.appendChild(script)
}

ensureAnalytics()

router.afterEach((to) => {
  if (to.meta.shell === 'app') loadDesignFonts()
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
