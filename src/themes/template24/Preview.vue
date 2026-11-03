<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { getGrainDataUrl } from '@/export/filter'
import { POST_WIDTH } from '@/config/constants'
import CoverImage from '../shared/CoverImage.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'
import PaginationDots from '../shared/PaginationDots.vue'
import { buildWashPatternLayout } from './pattern'
import { parseStyledRuns } from './styledText'

const { post, canvasSize } = storeToRefs(useEditorStore())
const t = computed(() => post.value.t24 || {})

const metaFont = computed(
  () => `'${t.value.customMetaFontFamily || t.value.metaFontFamily || 'Inter'}', Inter, sans-serif`,
)
const scoreFont = computed(
  () => `'${t.value.customFontFamily || t.value.fontFamily || 'Anton'}', 'Arial Narrow', Impact, sans-serif`,
)
const grainUrl = computed(() => (t.value.noiseAmount > 0 ? getGrainDataUrl(180) : ''))

const statusRuns = computed(() =>
  parseStyledRuns(
    t.value.statusText || 'FULL-TIME',
    t.value.statusWeight || 800,
    t.value.statusStyle || 'normal',
  ).map((run) => ({ ...run, text: run.text.toUpperCase() })),
)
const scorerRuns = computed(() =>
  parseStyledRuns(t.value.scorer || '', t.value.scorerWeight || 600, t.value.scorerStyle || 'normal'),
)

const washGradient = computed(() => {
  const hex = t.value.washColor || '#A855F7'
  const raw = String(hex).replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(full, 16)
  const r = Number.isFinite(n) ? (n >> 16) & 255 : 168
  const g = Number.isFinite(n) ? (n >> 8) & 255 : 85
  const b = Number.isFinite(n) ? n & 255 : 247
  const peak = t.value.washOpacity ?? 0.46
  return `linear-gradient(to top,
    rgba(${r},${g},${b},${peak}) 0%,
    rgba(${r},${g},${b},${peak * 0.88}) 28%,
    rgba(${r},${g},${b},${peak * 0.45}) 62%,
    rgba(${r},${g},${b},0) 100%)`
})

const crestTileBg = computed(() => {
  const hex = t.value.crestTileColor || '#cba3f0'
  const a = t.value.crestTileOpacity ?? 0.64
  const raw = String(hex).replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(full, 16)
  if (!Number.isFinite(n)) return `rgba(203,163,240,${a})`
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
})

const patternUrl = computed(() => t.value.patternUrl || t.value.watermarkUrl || '')

const patternIcons = computed(() => {
  if (!t.value.showPattern || !patternUrl.value) return []
  const canvasW = canvasSize.value?.width || POST_WIDTH
  const canvasH = canvasSize.value?.height || POST_WIDTH
  const washH = ((t.value.washHeight ?? 40) / 100) * canvasH
  const size = t.value.patternSize || 96
  return buildWashPatternLayout({
    width: canvasW,
    height: washH,
    count: t.value.patternCount ?? 8,
    iconSize: size,
    gap: t.value.patternGap ?? 160,
    random: t.value.patternRandom !== false,
    jitter: t.value.patternJitter ?? 40,
    padTop: t.value.patternPadTop ?? 20,
    padLeft: t.value.patternPadLeft ?? 24,
    padRight: t.value.patternPadRight ?? 24,
    padBottom: t.value.patternPadBottom ?? 24,
    seed: t.value.patternSeed ?? 7,
  }).map((p, i) => ({
    key: i,
    left: p.x,
    top: p.y,
    size,
  }))
})
</script>

<template>
  <div class="t24">
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
      class="dim"
      :style="{ backgroundColor: t.overlayColor || '#FFFFFF', opacity: t.overlayOpacity ?? 0.08 }"
    />

    <div
      v-if="t.noiseAmount > 0"
      class="grain"
      :style="{
        backgroundImage: `url('${grainUrl}')`,
        opacity: Math.min(1, (t.noiseAmount || 0) * 1.55),
      }"
    />

    <div
      class="wash"
      :style="{
        height: `${t.washHeight ?? 40}%`,
        background: washGradient,
      }"
    >
      <img
        v-for="icon in patternIcons"
        :key="icon.key"
        class="pattern-icon"
        :src="patternUrl"
        alt=""
        :style="{
          left: `${icon.left}px`,
          top: `${icon.top}px`,
          width: `${icon.size}px`,
          height: `${icon.size}px`,
          opacity: t.patternOpacity ?? 0.22,
        }"
      />
    </div>

    <div
      class="board"
      :style="{
        bottom: `${t.boardBottom ?? 52}px`,
        padding: `0 ${t.boardInset ?? 34}px`,
      }"
    >
      <div class="team left">
        <div
          v-if="t.showCrests && t.homeCrest"
          class="crest-tile"
          :style="{
            background: crestTileBg,
            width: `${t.crestSize || 96}px`,
            height: `${t.crestSize || 96}px`,
            borderRadius: `${t.crestRadius ?? 0}px`,
          }"
        >
          <div
            class="crest"
            :style="{ backgroundImage: `url(${t.homeCrest})` }"
          />
        </div>
        <span
          class="name"
          :style="{
            fontFamily: metaFont,
            fontSize: `${t.teamSize || 32}px`,
            fontWeight: t.teamWeight || 800,
            fontStyle: t.teamStyle || 'normal',
            color: t.teamColor || '#FFFFFF',
            letterSpacing: `${t.teamLetterSpacing ?? 0.08}em`,
            marginTop: `${t.teamGap ?? 9}px`,
          }"
        >{{ t.homeName || 'HOME' }}</span>
      </div>

      <div class="center">
        <div class="score-row" :style="{ gap: `${t.scoreGap ?? 14}px` }">
          <span
            class="score"
            :style="{
              fontFamily: scoreFont,
              fontSize: `${t.fontSize || 125}px`,
              color: t.scoreColor || '#FFFFFF',
              letterSpacing: `${t.letterSpacing ?? 0.01}em`,
            }"
          >{{ t.homeScore ?? '0' }}</span>

          <div
            class="mid"
            :style="{
              marginLeft: `${(t.markGap ?? 14) - (t.scoreGap ?? 14)}px`,
              marginRight: `${(t.markGap ?? 14) - (t.scoreGap ?? 14)}px`,
              transform: `translate(${t.markOffsetX || 0}px, ${t.markOffsetY || 0}px)`,
            }"
          >
            <div
              v-if="t.showCenterMark && t.centerMarkUrl"
              class="mark-img"
              :style="{
                width: `${t.markSize || 36}px`,
                height: `${t.markSize || 36}px`,
                opacity: t.markOpacity ?? 1,
                backgroundColor: t.markColor || '#FFFFFF',
                WebkitMaskImage: `url(${t.centerMarkUrl})`,
                maskImage: `url(${t.centerMarkUrl})`,
              }"
            />
            <span
              v-else-if="t.showCenterMark"
              class="mark"
              :style="{
                color: t.markColor || '#FFFFFF',
                fontFamily: metaFont,
                fontSize: `${t.markSize || 14}px`,
                opacity: t.markOpacity ?? 1,
              }"
            >{{ t.centerMark || 'FT' }}</span>
          </div>

          <span
            class="score"
            :style="{
              fontFamily: scoreFont,
              fontSize: `${t.fontSize || 125}px`,
              color: t.scoreColor || '#FFFFFF',
              letterSpacing: `${t.letterSpacing ?? 0.01}em`,
            }"
          >{{ t.awayScore ?? '1' }}</span>
        </div>

        <p
          v-if="t.showStatus"
          class="status"
          :style="{
            fontFamily: metaFont,
            fontSize: `${t.statusSize || 13}px`,
            color: t.statusColor || 'rgba(255,255,255,0.92)',
            letterSpacing: `${t.statusLetterSpacing ?? 0.2}em`,
            marginTop: `${t.statusGap ?? 6}px`,
            transform: `translate(${t.statusOffsetX || 0}px, ${t.statusOffsetY || 0}px)`,
          }"
        >
          <span
            v-for="(run, i) in statusRuns"
            :key="`st-${i}`"
            :style="{ fontWeight: run.weight, fontStyle: run.style }"
          >{{ run.text }}</span>
        </p>
      </div>

      <div class="team right">
        <div
          v-if="t.showCrests && t.awayCrest"
          class="crest-tile"
          :style="{
            background: crestTileBg,
            width: `${t.crestSize || 96}px`,
            height: `${t.crestSize || 96}px`,
            borderRadius: `${t.crestRadius ?? 0}px`,
          }"
        >
          <div
            class="crest"
            :style="{ backgroundImage: `url(${t.awayCrest})` }"
          />
        </div>
        <span
          class="name"
          :style="{
            fontFamily: metaFont,
            fontSize: `${t.teamSize || 32}px`,
            fontWeight: t.teamWeight || 800,
            fontStyle: t.teamStyle || 'normal',
            color: t.teamColor || '#FFFFFF',
            letterSpacing: `${t.teamLetterSpacing ?? 0.08}em`,
            marginTop: `${t.teamGap ?? 9}px`,
          }"
        >{{ t.awayName || 'AWAY' }}</span>
        <p
          v-if="t.showScorer && t.scorer"
          class="scorer"
          :style="{
            fontFamily: metaFont,
            fontSize: `${t.scorerSize || 15}px`,
            color: t.scorerColor || 'rgba(255,255,255,0.88)',
            letterSpacing: `${t.scorerLetterSpacing ?? 0.02}em`,
            marginTop: `${t.scorerGap ?? 6}px`,
            transform: `translate(${t.scorerOffsetX || 0}px, ${t.scorerOffsetY || 0}px)`,
          }"
        >
          <span
            v-for="(run, i) in scorerRuns"
            :key="`sc-${i}`"
            :style="{ fontWeight: run.weight, fontStyle: run.style }"
          >{{ run.text }}</span>
        </p>
      </div>
    </div>

    <div v-if="t.showDots" class="dots-wrap">
      <PaginationDots
        :count="t.dotCount || 2"
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
.t24 {
  position: absolute;
  inset: 0;
  background: #050505;
  overflow: hidden;
}
.photo,
.dim,
.grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.grain {
  z-index: 8;
  mix-blend-mode: multiply;
  background-size: 180px 180px;
  background-repeat: repeat;
  filter: contrast(1.55) brightness(1.05);
}
.wash {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 12;
  pointer-events: none;
  overflow: hidden;
}
.pattern-icon {
  position: absolute;
  object-fit: contain;
  pointer-events: none;
  filter: grayscale(1) brightness(2);
  mix-blend-mode: soft-light;
}
.board {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: start;
  column-gap: 14px;
  pointer-events: none;
}
.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  min-width: 0;
}
.crest-tile {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
}
.crest {
  width: 70%;
  height: 70%;
  background: center / contain no-repeat;
}
.name {
  display: block;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
}
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 2px;
  padding-top: 4px;
  min-width: 150px;
}
.score-row {
  display: flex;
  align-items: center;
  justify-content: center;
}
.score {
  line-height: 0.86;
  text-shadow: 0 3px 16px rgba(0, 0, 0, 0.4);
  min-width: 0.55em;
  text-align: center;
}
.mid {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  padding-bottom: 4px;
}
.mark-img {
  display: block;
  flex: 0 0 auto;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
}
.mark {
  line-height: 1;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.status {
  margin: 0;
  text-transform: uppercase;
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.scorer {
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
  text-align: center;
  white-space: nowrap;
}
.dots-wrap {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 22;
}
</style>
