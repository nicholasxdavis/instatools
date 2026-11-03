<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'
import PaginationDots from '../shared/PaginationDots.vue'

const { post } = storeToRefs(useEditorStore())
const t = computed(() => post.value.t20 || {})

const metaFont = computed(
  () => `'${t.value.customMetaFontFamily || t.value.metaFontFamily || 'Inter'}', Inter, sans-serif`,
)
const scoreFont = computed(
  () => `'${t.value.customFontFamily || t.value.fontFamily || 'Anton'}', 'Arial Narrow', Impact, sans-serif`,
)
const barBg = computed(() => {
  const hex = t.value.barColor || '#1A0A2E'
  const a = t.value.barOpacity ?? 0.86
  const raw = String(hex).replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(full, 16)
  if (!Number.isFinite(n)) return `rgba(26,10,46,${a})`
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
})
const bottomFade = computed(() => {
  const s = t.value.bottomFadeStrength ?? 0.5
  return `linear-gradient(to top, rgba(0,0,0,${s}) 0%, transparent 100%)`
})
</script>

<template>
  <div class="t20">
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
    <div
      class="bottom-fade"
      :style="{ height: `${t.bottomFadeHeight ?? 36}%`, background: bottomFade }"
    />
    <div class="dim" :style="{ backgroundColor: t.overlayColor, opacity: t.overlayOpacity }" />

    <div
      class="bar"
      :style="{
        background: barBg,
        bottom: `${t.barBottom || 48}px`,
        margin: `0 ${t.barInset || 24}px`,
        borderRadius: `${t.barRadius || 14}px`,
        padding: `${t.barPadV || 18}px ${t.barPadH || 22}px`,
      }"
    >
      <div class="team left">
        <div
          v-if="t.showCrests && t.homeCrest"
          class="crest"
          :style="{ backgroundImage: `url(${t.homeCrest})` }"
        />
        <span
          class="name"
          :style="{
            fontFamily: metaFont,
            fontSize: `${t.teamSize || 18}px`,
            color: t.teamColor || '#FFFFFF',
            letterSpacing: `${t.teamLetterSpacing ?? 0.06}em`,
          }"
        >{{ t.homeName || 'HOME' }}</span>
      </div>

      <div class="center">
        <span
          class="score"
          :style="{
            fontFamily: scoreFont,
            fontSize: `${t.fontSize || 84}px`,
            color: t.scoreColor || '#FFFFFF',
            letterSpacing: `${t.letterSpacing ?? 0.01}em`,
          }"
        >{{ t.homeScore ?? '0' }}</span>

        <div class="mid">
          <span
            v-if="t.showCenterMark"
            class="mark"
            :style="{
              color: t.markColor || '#FFFFFF',
              fontFamily: metaFont,
              fontSize: `${t.markSize || 14}px`,
              letterSpacing: '0.18em',
            }"
          >{{ t.centerMark || 'LIVE' }}</span>
          <span
            v-if="t.showStatus"
            class="status"
            :style="{
              fontFamily: metaFont,
              fontSize: `${t.statusSize || 14}px`,
              color: t.statusColor || 'rgba(255,255,255,0.88)',
              letterSpacing: `${t.statusLetterSpacing ?? 0.18}em`,
            }"
          >{{ t.statusText || 'FULL-TIME' }}</span>
        </div>

        <span
          class="score"
          :style="{
            fontFamily: scoreFont,
            fontSize: `${t.fontSize || 84}px`,
            color: t.scoreColor || '#FFFFFF',
            letterSpacing: `${t.letterSpacing ?? 0.01}em`,
          }"
        >{{ t.awayScore ?? '1' }}</span>
      </div>

      <div class="team right">
        <div
          v-if="t.showCrests && t.awayCrest"
          class="crest"
          :style="{ backgroundImage: `url(${t.awayCrest})` }"
        />
        <span
          class="name"
          :style="{
            fontFamily: metaFont,
            fontSize: `${t.teamSize || 18}px`,
            color: t.teamColor || '#FFFFFF',
            letterSpacing: `${t.teamLetterSpacing ?? 0.06}em`,
          }"
        >{{ t.awayName || 'AWAY' }}</span>
      </div>
    </div>

    <p
      v-if="t.showScorer && t.scorer"
      class="scorer"
      :style="{
        fontFamily: metaFont,
        fontSize: `${t.scorerSize || 16}px`,
        color: t.scorerColor || '#FFFFFF',
        bottom: `${(t.barBottom || 48) + 10}px`,
        left: `${(t.barInset || 24) + 18}px`,
        letterSpacing: `${t.scorerLetterSpacing ?? 0.03}em`,
      }"
    >
      {{ t.scorer }}
    </p>

    <div v-if="t.showDots" class="dots-wrap">
      <PaginationDots
        :count="t.dotCount || 4"
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
.t20 {
  position: absolute;
  inset: 0;
  background: #050505;
  overflow: hidden;
}
.photo,
.dim,
.bottom-fade {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.bottom-fade {
  top: auto;
  bottom: 0;
  left: 0;
  right: 0;
}
.bar {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: 20px;
  backdrop-filter: blur(14px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
}
.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}
.crest {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1) center / contain no-repeat;
  flex: 0 0 auto;
}
.name {
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}
.center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}
.score {
  line-height: 0.9;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  min-width: 0.6em;
  text-align: center;
}
.mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 72px;
}
.status {
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}
.mark {
  line-height: 1;
  font-weight: 800;
  text-transform: uppercase;
}
.scorer {
  position: absolute;
  z-index: 21;
  margin: 0;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
  transform: translateY(-100%);
  pointer-events: none;
}
.dots-wrap {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 22;
}
</style>
