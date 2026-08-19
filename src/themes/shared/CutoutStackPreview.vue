<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { getGrainDataUrl } from '@/export/filter'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import WatermarkLayer from './WatermarkLayer.vue'

const props = defineProps({
  sliceKey: { type: String, required: true },
})

const { post } = storeToRefs(useEditorStore())
const slice = computed(() => post.value[props.sliceKey] || {})
const grainUrl = computed(() => (slice.value.noiseAmount > 0 ? getGrainDataUrl(180) : ''))
const fontStack = computed(() =>
  `'${slice.value.customFontFamily || slice.value.fontFamily}', sans-serif`,
)
const glow = computed(() => {
  const x = slice.value.glowX ?? 50
  const y = slice.value.glowY ?? 36
  const size = slice.value.glowSize ?? 72
  const color = slice.value.glowColor || '#b08958'
  return `radial-gradient(circle at ${x}% ${y}%, ${color} 0%, transparent ${size}%)`
})
const wash = computed(() => {
  const h = slice.value.fadeHeight ?? 40
  const s = slice.value.fadeStrength ?? 0.9
  const c = slice.value.bgColor || '#24160f'
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
  const t = slice.value
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
  <div class="cutout-stack" :style="{ background: slice.bgColor }">
    <div class="glow" :style="{ background: glow }" />
    <div
      v-if="slice.noiseAmount > 0"
      class="grain"
      :style="{
        backgroundImage: `url('${grainUrl}')`,
        opacity: Math.min(1, slice.noiseAmount * 1.5),
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
      :src="slice.logoUrl"
      :size="slice.logoSize"
      :opacity="slice.logoOpacity"
      :pos-x="slice.logoPosX"
      :pos-y="slice.logoPosY"
      :visible="slice.showLogo"
      :z-index="40"
    />

    <div class="copy" :style="{ padding: `0 ${slice.paddingH}px ${slice.paddingBottom}px` }">
      <div
        class="eyebrows"
        :style="{
          fontFamily: fontStack,
          fontSize: `${slice.eyebrowSize}px`,
          color: slice.eyebrowColor,
          letterSpacing: `${slice.eyebrowLetterSpacing || 0}em`,
        }"
      >
        <span>{{ slice.eyebrowLeft }}</span>
        <span>{{ slice.eyebrowRight }}</span>
      </div>
      <p
        :style="{
          fontFamily: fontStack,
          fontSize: `${slice.fontSize}px`,
          fontWeight: slice.fontWeight,
          color: slice.headlineColor,
          lineHeight: slice.lineHeight,
          letterSpacing: `${slice.letterSpacing || 0}em`,
          textAlign: slice.textAlign || 'center',
        }"
      >{{ slice.headline }}</p>
    </div>

    <div
      v-if="slice.showSwipe"
      class="swipe"
      :style="{
        fontFamily: fontStack,
        fontSize: `${slice.swipeFontSize}px`,
        color: slice.swipeColor,
        letterSpacing: `${slice.swipeLetterSpacing ?? 0.08}em`,
      }"
    >{{ slice.swipeText }}</div>
  </div>
</template>

<style scoped>
.cutout-stack { position: absolute; inset: 0; overflow: hidden; }
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
