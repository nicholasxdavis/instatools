<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { getGrainDataUrl } from '@/export/filter'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t12 = computed(() => post.value.t12)
const grainUrl = computed(() => (t12.value.noiseAmount > 0 ? getGrainDataUrl(180) : ''))
const fontStack = computed(() =>
  `'${t12.value.customFontFamily || t12.value.fontFamily}', sans-serif`,
)
const glow = computed(() => {
  const x = t12.value.glowX ?? 50
  const y = t12.value.glowY ?? 36
  const size = t12.value.glowSize ?? 72
  const color = t12.value.glowColor || '#b08958'
  return `radial-gradient(circle at ${x}% ${y}%, ${color} 0%, transparent ${size}%)`
})
const wash = computed(() => {
  const h = t12.value.fadeHeight ?? 40
  const s = t12.value.fadeStrength ?? 0.9
  const c = t12.value.bgColor || '#24160f'
  return {
    height: `${h}%`,
    background: `linear-gradient(to top, ${c} 0%, rgba(0,0,0,0) 100%)`,
    opacity: s,
  }
})
function fadeMask(top = 0, bottom = 0, left = 0, right = 0) {
  const clamp = (n) => Math.max(0, Math.min(80, Number(n) || 0))
  const t = clamp(top)
  const b = clamp(bottom)
  const l = clamp(left)
  const r = clamp(right)
  return {
    v: `linear-gradient(to bottom, transparent 0%, #000 ${t}%, #000 ${100 - b}%, transparent 100%)`,
    h: `linear-gradient(to right, transparent 0%, #000 ${l}%, #000 ${100 - r}%, transparent 100%)`,
  }
}

const cutouts = computed(() => {
  const t = t12.value
  return [
    {
      key: 'left',
      src: resolveMediaUrl(t.imageLeft),
      size: t.leftSize,
      x: t.leftPosX,
      y: t.leftPosY,
      z: 12,
      mask: fadeMask(t.leftFadeTop, t.leftFadeBottom, t.leftFadeLeft, t.leftFadeRight),
    },
    {
      key: 'right',
      src: resolveMediaUrl(t.imageRight),
      size: t.rightSize,
      x: t.rightPosX,
      y: t.rightPosY,
      z: 12,
      mask: fadeMask(t.rightFadeTop, t.rightFadeBottom, t.rightFadeLeft, t.rightFadeRight),
    },
    {
      key: 'center',
      src: resolveMediaUrl(t.imageCenter),
      size: t.centerSize,
      x: t.centerPosX,
      y: t.centerPosY,
      z: 18,
      mask: fadeMask(t.centerFadeTop, t.centerFadeBottom, t.centerFadeLeft, t.centerFadeRight),
    },
  ].filter((item) => !!item.src)
})
</script>

<template>
  <div class="t12" :style="{ background: t12.bgColor }">
    <div class="glow" :style="{ background: glow }" />
    <div
      v-if="t12.noiseAmount > 0"
      class="grain"
      :style="{
        backgroundImage: `url('${grainUrl}')`,
        opacity: Math.min(1, t12.noiseAmount * 1.5),
      }"
    />

    <div
      v-for="item in cutouts"
      :key="item.key"
      class="cutout"
      :style="{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `${item.size}px`,
        zIndex: item.z,
      }"
    >
      <div class="cutout-v" :style="{ '--mask': item.mask.v }">
        <div class="cutout-h" :style="{ '--mask': item.mask.h }">
          <img :src="item.src" alt="" />
        </div>
      </div>
    </div>

    <div class="wash" :style="wash" />

    <WatermarkLayer
      :src="t12.logoUrl"
      :size="t12.logoSize"
      :opacity="t12.logoOpacity"
      :pos-x="t12.logoPosX"
      :pos-y="t12.logoPosY"
      :visible="t12.showLogo"
      :z-index="40"
    />

    <div class="copy" :style="{ padding: `0 ${t12.paddingH}px ${t12.paddingBottom}px` }">
      <div
        class="eyebrows"
        :style="{
          fontFamily: fontStack,
          fontSize: `${t12.eyebrowSize}px`,
          color: t12.eyebrowColor,
          letterSpacing: `${t12.eyebrowLetterSpacing || 0}em`,
        }"
      >
        <span>{{ t12.eyebrowLeft }}</span>
        <span>{{ t12.eyebrowRight }}</span>
      </div>
      <p
        :style="{
          fontFamily: fontStack,
          fontSize: `${t12.fontSize}px`,
          fontWeight: t12.fontWeight,
          color: t12.headlineColor,
          lineHeight: t12.lineHeight,
          letterSpacing: `${t12.letterSpacing || 0}em`,
          textAlign: t12.textAlign || 'center',
        }"
      >{{ t12.headline }}</p>
    </div>

    <div
      v-if="t12.showSwipe"
      class="swipe"
      :style="{
        fontFamily: fontStack,
        fontSize: `${t12.swipeFontSize}px`,
        color: t12.swipeColor,
        letterSpacing: `${t12.swipeLetterSpacing ?? 0.08}em`,
      }"
    >{{ t12.swipeText }}</div>
  </div>
</template>

<style scoped>
.t12 { position: absolute; inset: 0; overflow: hidden; }
.glow, .grain, .wash { position: absolute; inset: 0; pointer-events: none; }
.glow { z-index: 1; }
.wash { top: auto; z-index: 22; }
.grain {
  z-index: 8;
  mix-blend-mode: multiply;
  background-size: 180px 180px;
  background-repeat: repeat;
  filter: contrast(1.45) brightness(1.08);
}
.cutout {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.cutout-v,
.cutout-h {
  -webkit-mask-image: var(--mask);
  mask-image: var(--mask);
}
.cutout img {
  width: 100%;
  height: auto;
  display: block;
}
.copy {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}
.eyebrows {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 10px;
  pointer-events: auto;
}
.copy p {
  margin: 0;
  width: 100%;
  text-transform: uppercase;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  pointer-events: auto;
}
.swipe {
  position: absolute;
  left: 48px;
  right: 48px;
  bottom: 28px;
  z-index: 32;
  text-align: center;
  font-weight: 800;
  text-transform: uppercase;
  line-height: 1.25;
}
</style>
