<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t = computed(() => post.value.t19 || {})

const fontStack = computed(
  () => `'${t.value.customFontFamily || t.value.fontFamily || 'Anton'}', 'Arial Narrow', Impact, sans-serif`,
)
const metaFont = computed(
  () => `'${t.value.customMetaFontFamily || t.value.metaFontFamily || 'Inter'}', Inter, sans-serif`,
)
const fadeBg = computed(() => {
  const strength = t.value.fadeStrength ?? 0.94
  const color = t.value.fadeColor || '#050505'
  return `linear-gradient(to top, ${hexToRgba(color, strength)} 0%, ${hexToRgba(color, strength * 0.55)} 48%, transparent 100%)`
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
  <div class="t19">
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

    <div class="fade" :style="{ height: `${t.fadeHeight ?? 52}%`, background: fadeBg }" />
    <div class="dim" :style="{ backgroundColor: t.overlayColor, opacity: t.overlayOpacity }" />

    <div
      class="copy"
      :style="{
        padding: `0 ${t.paddingH ?? 48}px ${t.paddingBottom ?? 64}px`,
        alignItems:
          t.textAlign === 'left' ? 'flex-start'
          : t.textAlign === 'right' ? 'flex-end'
          : 'center',
        textAlign: t.textAlign || 'center',
      }"
    >
      <div
        v-if="t.showBanner"
        class="banner"
        :style="{
          background: t.bannerBg || '#0a0a0a',
          borderColor: t.bannerBorder || '#CC0000',
          color: t.bannerColor || '#FFFFFF',
          fontFamily: fontStack,
          fontSize: `${t.bannerSize || 52}px`,
          letterSpacing: `${t.bannerLetterSpacing ?? 0.02}em`,
        }"
      >
        {{ t.bannerText || 'BREAKING NEWS' }}
      </div>

      <div
        v-if="t.showByline && t.byline"
        class="byline-row"
      >
        <span class="rule" :style="{ background: t.bannerBorder || '#CC0000' }" />
        <p
          class="byline"
          :style="{
            fontFamily: metaFont,
            fontSize: `${t.bylineSize || 18}px`,
            color: t.bylineColor || '#FFFFFF',
            letterSpacing: `${t.bylineLetterSpacing ?? 0.16}em`,
          }"
        >
          {{ t.byline }}
        </p>
        <span class="rule" :style="{ background: t.bannerBorder || '#CC0000' }" />
      </div>

      <p
        class="body"
        :style="{
          fontFamily: metaFont,
          fontSize: `${t.bodySize || 30}px`,
          fontWeight: t.bodyWeight || 600,
          color: t.bodyColor || '#FFFFFF',
          lineHeight: t.bodyLineHeight ?? 1.32,
          letterSpacing: `${t.bodyLetterSpacing ?? -0.01}em`,
          maxWidth: `${t.bodyMaxWidth || 88}%`,
        }"
      >
        {{ t.body }}
      </p>
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
.t19 {
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
.copy {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 20px;
  pointer-events: none;
}
.banner {
  display: inline-flex;
  align-items: center;
  border: 5px solid;
  padding: 12px 28px;
  font-weight: 400;
  text-transform: uppercase;
  line-height: 1;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}
.byline-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: min(100%, 560px);
  pointer-events: auto;
}
.rule {
  flex: 1 1 48px;
  max-width: 72px;
  height: 2px;
  opacity: 0.95;
}
.byline,
.body {
  margin: 0;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}
.byline {
  flex: 0 0 auto;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}
.body {
  width: 100%;
}
</style>
