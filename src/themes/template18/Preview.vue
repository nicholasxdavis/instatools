<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t = computed(() => post.value.t18 || {})

const fontStack = computed(
  () => `'${t.value.customFontFamily || t.value.fontFamily || 'Anton'}', 'Arial Narrow', Impact, sans-serif`,
)
const metaFont = computed(
  () => `'${t.value.customMetaFontFamily || t.value.metaFontFamily || 'Inter'}', Inter, sans-serif`,
)
const fadeBg = computed(() => {
  const strength = t.value.fadeStrength ?? 0.72
  const color = t.value.fadeColor || '#000000'
  // Right-side wash so type stays readable over the athlete
  return `linear-gradient(to left, ${hexToRgba(color, strength)} 0%, ${hexToRgba(color, strength * 0.45)} 48%, transparent 100%)`
})

function hexToRgba(hex, alpha) {
  const raw = String(hex || '#000000').replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(full, 16)
  if (!Number.isFinite(n)) return `rgba(0,0,0,${alpha})`
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

const headlineLines = computed(() => String(t.value.headline || '').split(/\r?\n/))
</script>

<template>
  <div class="t18">
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

    <div class="fade" :style="{ width: `${t.fadeHeight ?? 62}%`, background: fadeBg }" />
    <div class="dim" :style="{ backgroundColor: t.overlayColor, opacity: t.overlayOpacity }" />
    <div class="vignette" :style="{ opacity: t.vignetteOpacity ?? 0.35 }" />

    <div
      class="copy"
      :style="{
        padding: `${t.paddingTop ?? 120}px ${t.paddingH ?? 48}px ${t.paddingBottom ?? 72}px`,
        alignItems:
          t.textAlign === 'center' ? 'center'
          : t.textAlign === 'left' ? 'flex-start'
          : 'flex-end',
        textAlign: t.textAlign || 'right',
      }"
    >
      <div
        v-if="t.showBadge"
        class="badge"
        :style="{
          color: t.badgeColor || '#FFFFFF',
          borderColor: t.badgeBorder || t.accentColor || '#FB4F14',
          background: t.badgeBg || 'transparent',
          fontFamily: metaFont,
          fontSize: `${t.badgeSize || 20}px`,
          letterSpacing: `${t.badgeLetterSpacing ?? 0.16}em`,
        }"
      >
        {{ t.badgeText || 'DEFENSIVE' }}
      </div>

      <div class="headline-stack">
        <template v-for="(line, i) in headlineLines" :key="i">
          <p
            class="headline"
            :class="{ small: /^(of the|of)$/i.test(String(line).trim()) }"
            :style="{
              fontFamily: fontStack,
              fontSize: /^(of the|of)$/i.test(String(line).trim())
                ? `${Math.round((t.fontSize || 132) * 0.34)}px`
                : `${t.fontSize || 132}px`,
              fontWeight: t.fontWeight || 400,
              color: t.headlineColor || '#FFFFFF',
              lineHeight: t.lineHeight ?? 0.92,
              letterSpacing: `${t.letterSpacing ?? -0.01}em`,
              textTransform: t.uppercase !== false ? 'uppercase' : 'none',
            }"
          >
            <HeadlineMarkup
              :text="line"
              :color="t.headlineColor || '#FFFFFF'"
              :highlight="t.highlightColor || t.accentColor || '#FB4F14'"
            />
          </p>
        </template>
      </div>

      <p
        v-if="t.showMatchup && t.matchup"
        class="matchup"
        :style="{
          color: t.accentColor || '#FB4F14',
          fontFamily: metaFont,
          fontSize: `${t.matchupSize || 22}px`,
          letterSpacing: `${t.matchupLetterSpacing ?? 0.2}em`,
        }"
      >
        {{ t.matchup }}
      </p>

      <p
        v-if="t.showPlayer && t.player"
        class="player"
        :style="{
          color: t.playerColor || '#FFFFFF',
          fontFamily: metaFont,
          fontSize: `${t.playerSize || 26}px`,
          letterSpacing: `${t.playerLetterSpacing ?? 0.06}em`,
        }"
      >
        <span v-if="t.playerRole" class="role" :style="{ color: t.accentColor || '#FB4F14' }">{{ t.playerRole }}</span>
        {{ t.player }}
      </p>
    </div>

    <div v-if="t.showStars" class="stars" :style="{ color: t.starColor || '#FFFFFF' }">
      <span v-for="n in Math.max(1, Math.min(5, t.starCount || 3))" :key="n">★</span>
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
.t18 {
  position: absolute;
  inset: 0;
  background: #050505;
  overflow: hidden;
}
.photo,
.dim,
.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.fade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.vignette {
  background: radial-gradient(ellipse at 35% 45%, transparent 40%, rgba(0, 0, 0, 0.55) 100%);
}
.copy {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  pointer-events: none;
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 3px solid;
  border-radius: 999px;
  padding: 9px 24px;
  font-weight: 800;
  text-transform: uppercase;
  pointer-events: auto;
}
.headline-stack {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(100%, 520px);
  padding-right: 36px;
}
.headline {
  margin: 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  text-shadow: 0 4px 28px rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}
.headline.small {
  opacity: 0.95;
}
.matchup,
.player {
  margin: 0;
  font-weight: 800;
  text-transform: uppercase;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}
.player .role {
  margin-right: 0.4em;
}
.stars {
  position: absolute;
  right: 18px;
  top: 58%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 18px;
  z-index: 25;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
</style>
