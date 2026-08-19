import { createRouter, createWebHistory } from 'vue-router'
import { getThemeBySlug } from '../themes'

const MarketingHome = () => import('../views/MarketingHome.vue')
const PostGenerator = () => import('../views/PostGenerator.vue')
const NotFound = () => import('../views/NotFound.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'app',
      component: PostGenerator,
      meta: { shell: 'app' },
    },
    {
      path: '/home',
      name: 'home',
      component: MarketingHome,
      meta: { shell: 'marketing' },
    },
    {
      path: '/app',
      redirect: '/',
    },
    {
      path: '/tool',
      redirect: '/',
    },
    {
      path: '/tool/:pathMatch(.*)*',
      redirect: '/',
    },
    {
      path: '/themes/:slug',
      name: 'theme',
      component: PostGenerator,
      meta: { shell: 'app' },
      beforeEnter(to) {
        if (!getThemeBySlug(to.params.slug)) {
          return { name: 'not-found', params: { pathMatch: to.path.slice(1).split('/') } }
        }
        return true
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
      meta: { shell: 'app' },
    },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    if (to.name === 'home') return { top: 0 }
    return undefined
  },
})

export default router
