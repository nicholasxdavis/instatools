<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'
import PaginationDots from '../shared/PaginationDots.vue'

const { post } = storeToRefs(useEditorStore())
const t = computed(() => post.value.t21 || {})

const fontStack = computed(
  () => `'${t.value.customFontFamily || t.value.fontFamily || 'Anton'}', 'Arial Narrow', Impact, sans-serif`,
)
const metaFont = computed(
  () => `'${t.value.customMetaFontFamily || t.value.metaFontFamily || 'Inter'}', Inter, sans-serif`,
)
const fadeBg = computed(() => {
  const strength = t.value.fadeStrength ?? 0.82
  const color = t.value.fadeColor || '#000000'
  return `linear-gradient(to top, ${hexToRgba(color, strength)} 0%, ${hexToRgba(color, strength * 0.4)} 55%, transparent 100%)`
})

function hexToRgba(hex, alpha) {
  const raw = String(hex || '#000000').replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(full, 16)
  if (!Number.isFinite(n)) return `rgba(0,0,0,${alpha})`
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}
</script>

<template>
  <div class="t21">
    <div class="photo">
      <CoverImage
        :src="t.bgImage"
        :pos-x="t.imagePosX"
        :pos-y="t.imagePosY"
        :scale="t.imageScale"
        :opacity="t.bgOpacity ?? 1"
        alt="Background"
      />
    </div>

    <div class="fade" :style="{ height: `${t.fadeHeight ?? 46}%`, background: fadeBg }" />
    <div class="dim" :style="{ backgroundColor: t.overlayColor, opacity: t.overlayOpacity }" />

    <div
      class="headline-wrap"
      :style="{
        top: `${t.headlineTop ?? 50}%`,
        padding: `0 ${t.paddingH ?? 28}px`,
        textAlign: t.textAlign || 'center',
      }"
    >
      <p
        class="headline"
        :style="{
          fontFamily: fontStack,
          fontSize: `${t.fontSize || 150}px`,
          fontWeight: t.fontWeight || 400,
          color: t.headlineColor || '#FFFFFF',
          lineHeight: t.lineHeight ?? 0.99,
          letterSpacing: `${t.letterSpacing ?? -0.01}em`,
          textTransform: t.uppercase !== false ? 'uppercase' : 'none',
          textShadow: `0 ${(t.shadowBlur ?? 28) * 0.18}px ${(t.shadowBlur ?? 28) * 0.55}px rgba(0,0,0,${t.shadowOpacity ?? 0.78}), 0 2px 10px rgba(0,0,0,${Math.min(1, (t.shadowOpacity ?? 0.78) + 0.12)})`,
        }"
      >
        <HeadlineMarkup
          :text="t.headline"
          :color="t.headlineColor || '#FFFFFF'"
          :highlight="t.highlightColor || '#C83803'"
        />
      </p>
    </div>

    <p
      v-if="t.showCaption && t.caption"
      class="caption"
      :style="{
        fontFamily: metaFont,
        fontSize: `${t.captionSize || 24}px`,
        fontWeight: t.captionWeight || 700,
        color: t.captionColor || '#FFFFFF',
        letterSpacing: `${t.captionLetterSpacing ?? 0.04}em`,
        lineHeight: t.captionLineHeight ?? 1.25,
        maxWidth: `${t.captionMaxWidth || 92}%`,
        bottom: `${t.paddingBottom ?? 56}px`,
        textAlign: t.textAlign || 'center',
        left: t.textAlign === 'left' ? `${t.paddingH ?? 36}px` : undefined,
        right: t.textAlign === 'right' ? `${t.paddingH ?? 36}px` : undefined,
        marginLeft: t.textAlign === 'center' || !t.textAlign ? 'auto' : undefined,
        marginRight: t.textAlign === 'center' || !t.textAlign ? 'auto' : undefined,
      }"
    >
      {{ t.caption }}
    </p>

    <div v-if="t.showDots" class="dots-wrap">
      <PaginationDots
        :count="t.dotCount || 5"
        :active="t.activeDot || 0"
        :color="t.dotColor || '#FFFFFF'"
      />
    </div>

    <WatermarkLayer
      :src="t.watermarkUrl"
      :size="t.watermarkSize"
      :opacity="t.watermarkOpacity"
      :pos-x="t.watermarkPosX"
      :pos-y="t.watermarkPosY"
      :visible="t.showWatermark"
    />
  </div>
</template>

<style scoped>
.t21 {
  position: absolute;
  inset: 0;
  background: #050505;
  overflow: hidden;
}
.photo,
.fade,
.dim {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.fade {
  top: auto;
  bottom: 0;
  left: 0;
  right: 0;
}
.headline-wrap {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 20;
  transform: translateY(-50%);
  pointer-events: none;
}
.headline {
  margin: 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  pointer-events: auto;
}
.caption {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 20;
  margin: 0;
  text-transform: uppercase;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}
.dots-wrap {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  z-index: 25;
}
</style>
