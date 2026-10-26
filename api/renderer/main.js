import { createApp } from 'vue'
import { createPinia } from 'pinia'
import HeadlessRender from './HeadlessRender.vue'
import { loadDesignFonts } from '@/seo/fonts'
import '@/assets/main.css'
import './render.css'

loadDesignFonts()

const app = createApp(HeadlessRender)
app.use(createPinia())
app.mount('#app')
