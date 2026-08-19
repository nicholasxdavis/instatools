<script setup>
import { computed } from 'vue'
import { watermarkPlacement } from '@/utils/image'
import { isVideoSource } from '@/utils/media'
import { resolveMediaUrl } from '@/utils/mediaUrl'

const props = defineProps({
  src: { type: String, default: '' },
  size: { type: Number, default: 200 },
  opacity: { type: Number, default: 1 },
  posX: { type: Number, default: 50 },
  posY: { type: Number, default: 50 },
  visible: { type: Boolean, default: true },
  zIndex: { type: [Number, String], default: 40 },
})

const style = computed(() => ({
  ...watermarkPlacement(props.posX, props.posY),
  opacity: Number.isFinite(Number(props.opacity)) ? Number(props.opacity) : 0.8,
  zIndex: props.zIndex,
  pointerEvents: 'none',
}))

const mediaStyle = computed(() => ({
  width: `${props.size}px`,
  height: 'auto',
  objectFit: 'contain',
  pointerEvents: 'none',
  display: 'block',
}))

const resolvedSrc = computed(() => resolveMediaUrl(props.src))
const isVideo = computed(() => isVideoSource(resolvedSrc.value))

function onError(event) {
  const el = event.target
  const src = resolvedSrc.value
  if (!el.dataset.retry && src) {
    el.dataset.retry = '1'
    el.src = `${src}${src.includes('?') ? '&' : '?'}r=${Date.now()}`
    return
  }
  el.style.display = 'none'
}

function onLoad(event) {
  event.target.style.display = 'block'
}
</script>

<template>
  <div v-if="resolvedSrc && visible" :style="style">
    <video
      v-if="isVideo"
      :key="resolvedSrc"
      :src="resolvedSrc"
      :style="mediaStyle"
      autoplay
      loop
      muted
      playsinline
    />
    <img
      v-else
      :key="resolvedSrc"
      :src="resolvedSrc"
      alt=""
      :style="mediaStyle"
      @error="onError"
      @load="onLoad"
    />
  </div>
</template>
