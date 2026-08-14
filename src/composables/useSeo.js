import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { applySeo } from '@/seo/apply'
import { pageForRoute } from '@/seo/pages'

export function useSeo() {
  const route = useRoute()
  const page = computed(() => pageForRoute(route))

  watch(
    page,
    (next) => applySeo(next),
    { immediate: true },
  )

  return { page }
}
