<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { NOISE_SVG } from '@/config/constants'
import { hexToRgb } from '@/utils/image'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'
import { ChevronRight } from '@lucide/vue'

const store = useEditorStore()
const { post } = storeToRefs(store)
const s = computed(() => post.value.style)

const glowShadow = computed(() => {
  if (!s.value.showOverlayGlow) return '0 10px 25px rgba(0,0,0,0.3)'
  const { r, g, b } = hexToRgb(s.value.overlayGlowColor || s.value.overlayBorderColor || '#FF5500')
  const base = s.value.overlayImgSize
  const size = s.value.overlayGlowSize ?? 1
  const intensity = s.value.overlayGlowIntensity ?? 0.5
  return [
    `0 0 ${base * 0.4 * size}px ${base * 0.2 * size}px rgba(${r}, ${g}, ${b}, ${intensity * 0.5})`,
    `0 0 ${base * 0.6 * size}px ${base * 0.3 * size}px rgba(${r}, ${g}, ${b}, ${intensity * 0.375})`,
    `0 0 ${base * 0.8 * size}px ${base * 0.4 * size}px rgba(${r}, ${g}, ${b}, ${intensity * 0.25})`,
  ].join(', ')
})

const circleBorder = computed(() => {
  if (s.value.showOverlayBorder === false || s.value.overlayBorderWidth <= 0) return 'none'
  return `${s.value.overlayBorderWidth}px solid ${s.value.overlayBorderColor}`
})
</script>

<template>
  <div class="t1">
    <div class="layer bg">
      <CoverImage
        :src="post.bgImage"
        :pos-x="s.imagePosX"
        :pos-y="s.imagePosY"
        :scale="s.imageScale"
        :opacity="s.bgOpacity"
        alt="Background"
      />
      <div class="noise" :style="{ opacity: s.bgNoise, backgroundImage: `url('${NOISE_SVG}')` }" />
    </div>

    <div class="layer gradient" :style="{ background: `linear-gradient(to bottom, transparent 0%, transparent 40%, ${s.overlayColor} 85%, ${s.overlayColor} 100%)` }" />
    <div class="layer dim" :style="{ backgroundColor: s.overlayColor, opacity: s.overlayOpacity }" />

    <div
      v-if="s.overlayImgUrl"
      class="circle"
      :class="{ ghost: s.showOverlay === false }"
      :style="{
        width: `${s.overlayImgSize}px`,
        height: `${s.overlayImgSize}px`,
        left: `${s.overlayImgPosX}%`,
        top: `${s.overlayImgPosY}%`,
        border: circleBorder,
        boxShadow: glowShadow,
      }"
    >
      <CoverImage :src="s.overlayImgUrl" alt="Overlay" />
      <div class="noise" :style="{ opacity: s.overlayNoise, backgroundImage: `url('${NOISE_SVG}')` }" />
    </div>

    <div
      v-if="s.logoUrl"
      class="logo"
      :class="{ ghost: s.showLogo === false }"
      :style="{ opacity: s.logoOpacity, width: `${s.logoSize}px` }"
    >
      <CoverImage :src="s.logoUrl" fit="contain" alt="Logo" />
    </div>

    <div class="swipe" :class="{ ghost: !s.showSwipeBadge }" :style="{
      fontFamily: `${s.customSwipeFontFamily || s.swipeFontFamily || 'Inter'}, sans-serif`,
      fontSize: `${s.swipeFontSize || 20}px`,
      color: s.swipeTextColor || s.swipeColor || '#FFFFFF',
      opacity: s.swipeOpacity ?? 0.9,
      letterSpacing: `${s.swipeLetterSpacing ?? 0.1}em`,
    }">
      {{ s.swipeText || 'Swipe Left' }}
      <ChevronRight
        v-if="s.swipeShowIcon !== false"
        :size="s.swipeIconSize || 24"
        :stroke-width="3"
        :style="{ color: s.swipeTextColor || s.swipeColor || '#FFFFFF' }"
      />
    </div>

    <div class="copy">
      <div class="stack">
        <div class="badge" :class="{ ghost: !s.showNewsBadge }">{{ s.badgeText }}</div>
        <p
          class="headline"
          :style="{
            fontFamily: s.customFontFamily || s.fontFamily,
            fontSize: `${s.fontSize}px`,
            lineHeight: s.lineHeight,
            letterSpacing: `${s.letterSpacing}em`,
          }"
        >
          <HeadlineMarkup
            :text="post.headline"
            :color="s.primaryColor"
            :highlight="s.highlightColor"
            :secondary="s.secondaryColor"
            :use-brackets="s.useBracketColor"
            :use-braces="s.useBraceColor"
          />
        </p>
        <p v-if="post.caption" class="caption">{{ post.caption }}</p>
      </div>
    </div>

    <div class="source" :class="{ ghost: !s.showSource }">
      <p>{{ s.sourceText }}</p>
    </div>

    <WatermarkLayer
      :src="s.watermarkUrl"
      :size="s.watermarkSize"
      :opacity="s.watermarkOpacity"
      :pos-x="s.watermarkPosX"
      :pos-y="s.watermarkPosY"
      :visible="s.showWatermark"
    />
  </div>
</template>

<style scoped>
.t1 { position: absolute; inset: 0; overflow: hidden; background: #000; }
.layer { position: absolute; inset: 0; }
.bg { z-index: 0; }
.gradient, .dim { z-index: 10; pointer-events: none; }
.noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: overlay;
  background-size: 200px 200px;
  background-repeat: repeat;
}
.circle {
  position: absolute;
  z-index: 15;
  border-radius: 50%;
  overflow: hidden;
  transform: translate(-50%, -50%);
}
.circle img,
.circle video { width: 100%; height: 100%; object-fit: cover; }
.logo {
  position: absolute;
  top: 40px;
  left: 40px;
  z-index: 30;
}
.logo img,
.logo video {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1));
}
.swipe {
  position: absolute;
  top: 48px;
  right: 40px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  text-transform: uppercase;
  text-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
.copy {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 64px;
  pointer-events: none;
}
.stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 32px;
}
.badge {
  background: #fff;
  color: #000;
  padding: 4px 16px;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 10px 15px rgba(0,0,0,0.2);
  pointer-events: auto;
}
.headline {
  margin: 0;
  text-transform: uppercase;
  word-break: break-word;
  width: 100%;
  text-shadow: 0 4px 20px rgba(0,0,0,0.6);
  pointer-events: auto;
}
.caption {
  color: #e5e5e5;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.625;
  opacity: 0.9;
  max-width: 95%;
  text-shadow: 0 4px 6px rgba(0,0,0,0.3);
  pointer-events: auto;
}
.source {
  position: absolute;
  bottom: 32px;
  right: 48px;
  z-index: 30;
  text-align: right;
}
.source p {
  font-size: 18px;
  color: #a3a3a3;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-weight: 700;
  opacity: 0.6;
  text-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
</style>
