import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { loadDesignFonts } from './seo/fonts'
import './assets/main.css'

router.afterEach((to) => {
  if (to.meta.shell === 'app') loadDesignFonts()
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
