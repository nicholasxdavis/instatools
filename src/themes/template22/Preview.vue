<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t = computed(() => post.value.t22 || {})

const fontStack = computed(
  () => `'${t.value.customFontFamily || t.value.fontFamily || 'Anton'}', 'Arial Narrow', Impact, sans-serif`,
)
const fadeBg = computed(() => {
  const strength = t.value.fadeStrength ?? 0.88
  const color = t.value.fadeColor || '#6B0000'
  return `linear-gradient(to top, ${hexToRgba(color, strength)} 0%, ${hexToRgba(color, strength * 0.45)} 55%, transparent 100%)`
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
  <div class="t22">
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

    <div class="fade" :style="{ height: `${t.fadeHeight ?? 38}%`, background: fadeBg }" />
    <div class="dim" :style="{ backgroundColor: t.overlayColor, opacity: t.overlayOpacity }" />

    <div
      v-if="t.showMark && t.markUrl"
      class="mark"
      :style="{
        width: `${t.markSize || 180}px`,
        bottom: `${t.markBottom || 210}px`,
        opacity: t.markOpacity ?? 1,
      }"
    >
      <CoverImage :src="t.markUrl" fit="contain" alt="Mark" />
    </div>

    <div
      class="copy"
      :style="{
        padding: `0 ${t.paddingH ?? 24}px ${t.paddingBottom ?? 42}px`,
        textAlign: t.textAlign || 'center',
      }"
    >
      <div
        v-if="t.showBanner"
        class="banner"
        :style="{
          background: t.bannerBg || '#C6011F',
          borderColor: t.bannerBorder || '#FFFFFF',
          color: t.bannerColor || '#FFFFFF',
          fontFamily: fontStack,
          fontSize: `${t.bannerSize || 64}px`,
          letterSpacing: `${t.bannerLetterSpacing ?? 0.02}em`,
          borderWidth: `${t.bannerBorderWidth ?? 4}px`,
        }"
      >
        <HeadlineMarkup
          :text="t.headline || 'TRENDING'"
          :color="t.bannerColor || '#FFFFFF'"
          :highlight="t.highlightColor || '#FFFFFF'"
        />
      </div>

      <p
        v-else
        class="headline fade-type"
        :style="{
          fontFamily: fontStack,
          fontSize: `${t.fontSize || 140}px`,
          fontWeight: t.fontWeight || 400,
          lineHeight: t.lineHeight ?? 0.88,
          letterSpacing: `${t.letterSpacing ?? 0.01}em`,
          textTransform: t.uppercase !== false ? 'uppercase' : 'none',
          backgroundImage: `linear-gradient(to bottom, ${t.headlineColor || '#FFFFFF'} 0%, ${t.headlineFadeColor || '#C8C8C8'} 100%)`,
        }"
      >
        <HeadlineMarkup
          :text="t.headline || 'TRENDING'"
          :color="t.headlineColor || '#FFFFFF'"
          :highlight="t.highlightColor || '#FFFFFF'"
        />
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
.t22 {
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
.mark {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 18;
  aspect-ratio: 1;
  pointer-events: none;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.45));
}
.copy {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.banner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-style: solid;
  padding: 10px 28px;
  text-transform: uppercase;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  max-width: 100%;
}
.headline {
  margin: 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  text-shadow: 0 6px 28px rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}
.fade-type {
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  filter: drop-shadow(0 4px 18px rgba(0, 0, 0, 0.45));
}
.fade-type :deep(span) {
  color: inherit !important;
  -webkit-text-fill-color: transparent;
}
</style>
