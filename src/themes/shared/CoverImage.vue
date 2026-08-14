<script setup>
import { computed } from 'vue'
import { coverImageStyle } from '@/utils/image'
import { isVideoSource } from '@/utils/media'

const props = defineProps({
  src: { type: String, default: '' },
  posX: { type: Number, default: 50 },
  posY: { type: Number, default: 50 },
  scale: { type: Number, default: 100 },
  opacity: { type: Number, default: 1 },
  alt: { type: String, default: 'Post photo' },
  fit: { type: String, default: 'cover' },
})

const mediaStyle = computed(() => {
  if (props.fit === 'contain') {
    return {
      width: '100%',
      height: 'auto',
      maxHeight: '100%',
      objectFit: 'contain',
      display: 'block',
      opacity: props.opacity,
    }
  }
  return coverImageStyle({
    posX: props.posX,
    posY: props.posY,
    scale: props.scale,
    opacity: props.opacity,
  })
})

const isVideo = computed(() => isVideoSource(props.src))

function onError(event) {
  const el = event.target
  if (!el.dataset.retry && props.src) {
    el.dataset.retry = '1'
    el.src = `${props.src}${props.src.includes('?') ? '&' : '?'}r=${Date.now()}`
    return
  }
  el.style.display = 'none'
}

function onLoad(event) {
  event.target.style.display = ''
}
</script>

<template>
  <video
    v-if="isVideo && src"
    :key="src"
    :src="src"
    :style="mediaStyle"
    autoplay
    loop
    muted
    playsinline
  />
  <img
    v-else-if="src"
    :key="src"
    :src="src"
    :alt="alt"
    :style="mediaStyle"
    @error="onError"
    @load="onLoad"
  />
</template>
