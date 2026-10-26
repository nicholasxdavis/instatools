<script setup>
import { computed, nextTick, onMounted, onUnmounted } from 'vue'
import { getTheme } from '@/themes'
import { useEditorStore } from '@/stores/editor'
import { parseImportedDesign, validateDesignPost } from '@/utils/design-io'

const SETTLE_MS = 120

const store = useEditorStore()
const theme = computed(() => getTheme(store.templateId))
const size = computed(() => store.canvasSize)

let applyGeneration = 0

function setReady(ready) {
  document.documentElement.dataset.ready = ready ? '1' : '0'
  window.__INSTATOOLS_READY = ready
}

function waitForMedia() {
  const root = document.querySelector('[data-instatools-artboard]')
  const images = [...(root?.querySelectorAll('img') || [])]
  const videos = [...(root?.querySelectorAll('video') || [])]
  return Promise.all([
    document.fonts?.ready ?? Promise.resolve(),
    ...images.map((img) => {
      if (img.complete) return Promise.resolve()
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
      })
    }),
    ...videos.map((video) => {
      if (video.readyState >= 2) return Promise.resolve()
      return new Promise((resolve) => {
        video.addEventListener('loadeddata', resolve, { once: true })
        video.addEventListener('error', resolve, { once: true })
      })
    }),
  ])
}

async function settle() {
  await nextTick()
  await waitForMedia()
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
}

function toPost(raw) {
  if (typeof raw === 'string' || raw?.type === 'instatools-design' || raw?.design || raw?.post) {
    return parseImportedDesign(raw)
  }
  return { post: raw, mode: 'post' }
}

async function applyDesignPayload(raw) {
  const generation = ++applyGeneration
  setReady(false)
  const parsed = toPost(raw)
  if (!parsed?.post || !validateDesignPost(parsed.post)) {
    throw new Error('Invalid design JSON')
  }
  if (!store.applyDesign({ mode: parsed.mode, post: parsed.post })) {
    throw new Error('Could not apply design')
  }
  await settle()
  if (generation !== applyGeneration) return snapshot()
  setReady(true)
  return snapshot()
}

function snapshot() {
  return {
    template: store.templateId,
    slug: theme.value?.slug || null,
    width: size.value.width,
    height: size.value.height,
    ready: document.documentElement.dataset.ready === '1',
  }
}

function onMessage(event) {
  const data = event.data
  if (!data || typeof data !== 'object') return
  if (data.type !== 'instatools:set-design' && data.type !== 'instatools:ping') return
  const source = event.source
  if (!source) return
  const origin = event.origin || '*'

  if (data.type === 'instatools:ping') {
    source.postMessage({ type: 'instatools:pong', ...snapshot() }, origin)
    return
  }

  applyDesignPayload(data.design ?? data.payload ?? data)
    .then((info) => {
      source.postMessage({ type: 'instatools:ready', ...info, requestId: data.requestId || null }, origin)
    })
    .catch((error) => {
      setReady(false)
      source.postMessage({
        type: 'instatools:error',
        requestId: data.requestId || null,
        error: error instanceof Error ? error.message : 'Failed to apply design',
      }, origin)
    })
}

onMounted(async () => {
  window.__INSTATOOLS_APPLY = applyDesignPayload
  window.addEventListener('message', onMessage)
  setReady(false)
  try {
    if (window.__INSTATOOLS_DESIGN) {
      await applyDesignPayload(window.__INSTATOOLS_DESIGN)
      return
    }
    await settle()
    setReady(true)
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'instatools:boot', ...snapshot() }, '*')
    }
  } catch {
    setReady(false)
  }
})

onUnmounted(() => {
  window.removeEventListener('message', onMessage)
  window.__INSTATOOLS_APPLY = undefined
})
</script>

<template>
  <div
    class="artboard"
    data-instatools-artboard
    :style="{
      width: `${size.width}px`,
      height: `${size.height}px`,
    }"
  >
    <component :is="theme.component" :key="theme.id" v-bind="theme.props || {}" />
  </div>
</template>

<style scoped>
.artboard {
  position: relative;
  overflow: hidden;
  background: #fff;
}
</style>
