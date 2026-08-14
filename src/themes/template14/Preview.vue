<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t14 = computed(() => post.value.t14)

const fontStack = computed(
  () => `'${t14.value.customFontFamily || t14.value.fontFamily}', 'Arial Narrow', Impact, sans-serif`,
)

const stripeBg = computed(() => {
  const a = t14.value.stripeColorA || '#C8102E'
  const b = t14.value.stripeColorB || '#0a0a0a'
  const size = Math.max(4, t14.value.stripeSize || 14)
  return `repeating-linear-gradient(${t14.value.stripeAngle ?? -45}deg, ${a} 0 ${size}px, ${b} ${size}px ${size * 2}px)`
})

const fadeBg = computed(() => {
  const strength = t14.value.fadeStrength ?? 0.95
  const color = t14.value.fadeColor || '#1a0508'
  return `linear-gradient(to bottom, transparent 0%, ${hexToRgba(color, strength * 0.55)} 48%, ${hexToRgba(color, strength)} 100%)`
})

function hexToRgba(hex, alpha) {
  const raw = String(hex || '#000000').replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(full, 16)
  if (!Number.isFinite(n)) return `rgba(0,0,0,${alpha})`
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}
</script>

<template>
  <div class="t14">
    <div
      v-if="t14.showStripes"
      class="stripe left"
      :style="{ width: `${t14.stripeWidth}px`, background: stripeBg }"
    />
    <div
      v-if="t14.showStripes"
      class="stripe right"
      :style="{ width: `${t14.stripeWidth}px`, background: stripeBg }"
    />

    <div class="stage" :style="{ inset: `0 ${t14.showStripes ? t14.stripeWidth : 0}px` }">
      <div class="photo">
        <CoverImage
          :src="t14.bgImage"
          :pos-x="t14.imagePosX"
          :pos-y="t14.imagePosY"
          :scale="t14.imageScale"
          alt="Background"
        />
      </div>

      <div
        class="fade"
        :style="{ height: `${t14.fadeHeight}%`, background: fadeBg }"
      />
      <div
        class="dim"
        :style="{ backgroundColor: t14.overlayColor, opacity: t14.overlayOpacity }"
      />

      <div
        class="copy"
        :style="{
          padding: `0 ${t14.paddingH}px ${t14.paddingBottom}px`,
        }"
      >
        <p
          class="headline"
          :style="{
            fontFamily: fontStack,
            fontSize: `${t14.fontSize}px`,
            fontWeight: t14.fontWeight,
            color: t14.headlineColor,
            lineHeight: t14.lineHeight,
            letterSpacing: `${t14.letterSpacing}em`,
            textAlign: t14.textAlign,
            textTransform: t14.uppercase ? 'uppercase' : 'none',
          }"
        >
          <HeadlineMarkup
            :text="t14.headline"
            :color="t14.headlineColor"
            :highlight="t14.highlightColor"
          />
        </p>
      </div>

      <WatermarkLayer
        :src="t14.watermarkUrl"
        :size="t14.watermarkSize"
        :opacity="t14.watermarkOpacity"
        :pos-x="t14.watermarkPosX"
        :pos-y="t14.watermarkPosY"
        :visible="t14.showWatermark"
      />
    </div>
  </div>
</template>

<style scoped>
.t14 {
  position: absolute;
  inset: 0;
  background: #0a0a0a;
  overflow: hidden;
}
.stripe {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 30;
  pointer-events: none;
}
.stripe.left { left: 0; }
.stripe.right { right: 0; }
.stage {
  position: absolute;
  overflow: hidden;
}
.photo,
.dim {
  position: absolute;
  inset: 0;
}
.dim,
.fade {
  pointer-events: none;
}
.fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
.copy {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  pointer-events: none;
}
.headline {
  margin: 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  pointer-events: auto;
  text-shadow: 0 4px 28px rgba(0, 0, 0, 0.55);
}
</style>
