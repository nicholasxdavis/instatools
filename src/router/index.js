import { createRouter, createWebHistory } from 'vue-router'
import { getThemeBySlug } from '../themes'

const MarketingHome = () => import('../views/MarketingHome.vue')
const PostGenerator = () => import('../views/PostGenerator.vue')
const DocsView = () => import('../views/DocsView.vue')
const PricingView = () => import('../views/PricingView.vue')
const AccountView = () => import('../views/AccountView.vue')
const NotFound = () => import('../views/NotFound.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MarketingHome,
      meta: { shell: 'marketing' },
    },
    {
      path: '/make',
      name: 'app',
      component: PostGenerator,
      meta: { shell: 'app' },
    },
    {
      path: '/home',
      redirect: '/',
    },
    {
      path: '/home/',
      redirect: '/',
    },
    {
      path: '/app',
      redirect: '/make',
    },
    {
      path: '/tool',
      redirect: '/make',
    },
    {
      path: '/tool/:pathMatch(.*)*',
      redirect: '/make',
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
      path: '/docs',
      name: 'docs',
      component: DocsView,
      meta: { shell: 'marketing' },
    },
    {
      path: '/docs/:slug',
      name: 'docs-page',
      component: DocsView,
      meta: { shell: 'marketing' },
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: PricingView,
      meta: { shell: 'marketing' },
    },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
      meta: { shell: 'marketing' },
    },
    {
      path: '/signup',
      redirect: '/account',
    },
    {
      path: '/signup/',
      redirect: '/account',
    },
    {
      path: '/apply',
      redirect: '/account',
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
    if (to.meta.shell === 'marketing') return { top: 0 }
    return undefined
  },
})

export default router
