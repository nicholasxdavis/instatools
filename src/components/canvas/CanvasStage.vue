<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getTheme } from '@/themes'
import { useEditorStore } from '@/stores/editor'

const MIN = 0.1
const MAX = 1.75

const store = useEditorStore()
const frame = ref(null)
const scale = ref(0.3)
const animateScale = ref(false)
let observer = null
let animTimer = 0
const theme = computed(() => getTheme(store.templateId))
const size = computed(() => store.canvasSize)
const canOut = computed(() => scale.value > MIN + 0.001)
const canIn = computed(() => scale.value < MAX - 0.001)

function fit() {
  if (store.splitDragging) return
  if (!frame.value) return
  if (store.manualZoom != null) {
    scale.value = store.manualZoom
    return
  }
  const rect = frame.value.getBoundingClientRect()
  const next = Math.min(rect.width / size.value.width, rect.height / size.value.height, 1)
  scale.value = Math.max(MIN, next * 0.88)
}

function withAnim(fn) {
  animateScale.value = true
  fn()
  clearTimeout(animTimer)
  animTimer = window.setTimeout(() => {
    animateScale.value = false
  }, 220)
}

function zoom(delta) {
  withAnim(() => {
    const current = store.manualZoom ?? scale.value
    const next = Math.min(MAX, Math.max(MIN, +(current + delta).toFixed(2)))
    store.manualZoom = next
    scale.value = next
  })
}

function resetFit() {
  withAnim(() => {
    store.manualZoom = null
    nextTick(fit)
  })
}

watch(
  () => [store.templateId, store.manualZoom, size.value.width, size.value.height],
  () => nextTick(fit),
)

watch(
  () => store.splitDragging,
  (dragging, wasDragging) => {
    if (wasDragging && !dragging) nextTick(fit)
  },
)

onMounted(() => {
  fit()
  window.addEventListener('resize', fit)
  if (frame.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => {
      if (store.splitDragging) return
      fit()
    })
    observer.observe(frame.value)
  }
})
onUnmounted(() => {
  window.removeEventListener('resize', fit)
  observer?.disconnect()
  clearTimeout(animTimer)
})
</script>

<template>
  <div class="stage" role="region" aria-label="Design preview">
    <div ref="frame" class="frame">
      <div
        class="artboard"
        :class="{ animate: animateScale }"
        :key="theme.id"
        :style="{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `scale(${scale})`,
        }"
      >
        <component :is="theme.component" :key="theme.id" v-bind="theme.props || {}" />
      </div>
    </div>
    <div class="zoom">
      <button type="button" aria-label="Zoom out" :disabled="!canOut" @click="zoom(-0.1)">−</button>
      <button
        type="button"
        class="pct"
        title="Fit to screen"
        :aria-label="`${Math.round(scale * 100)} percent, fit to screen`"
        @click="resetFit"
      >
        {{ Math.round(scale * 100) }}%
      </button>
      <button type="button" aria-label="Zoom in" :disabled="!canIn" @click="zoom(0.1)">+</button>
    </div>
  </div>
</template>

<style scoped>
.stage {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  background: #ececec;
  overflow: hidden;
}
.frame {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 56px;
  position: relative;
  z-index: 1;
}
.artboard {
  position: relative;
  flex-shrink: 0;
  transform-origin: center center;
  background: #fff;
  box-shadow:
    0 0 0 1px #e6e6e6,
    0 18px 50px rgba(0, 0, 0, 0.08);
  will-change: transform;
}
.artboard.animate {
  transition: transform 0.2s var(--ease);
}
.zoom {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  background-color: #515bd4;
  background-image: var(--grad-3);
  background-repeat: no-repeat;
  background-size: 160% 100%;
  background-position: 40% 50%;
  border: 0;
  border-radius: 999px;
  padding: 3px;
}
.zoom button {
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 16px;
  font-weight: 650;
  min-width: 34px;
  height: 30px;
  border-radius: 999px;
  line-height: 1;
  transition: background 0.15s ease, transform 0.15s var(--ease), opacity 0.15s ease;
}
.zoom button:hover { background: rgba(255, 255, 255, 0.16); }
.zoom button:active { transform: scale(0.94); }
.zoom button:disabled { opacity: 0.35; }
.zoom .pct {
  min-width: 52px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

@media (max-width: 899px) {
  .frame { padding: 12px 12px 52px; }
  .zoom {
    bottom: 10px;
    padding: 4px;
  }
  .zoom button {
    min-width: 40px;
    height: 34px;
    font-size: 18px;
  }
  .zoom .pct {
    min-width: 56px;
    font-size: 13px;
  }
}
</style>
