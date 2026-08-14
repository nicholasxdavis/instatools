<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import PaginationDots from '../shared/PaginationDots.vue'

const props = defineProps({
  variant: { type: String, default: 't6' },
})

const { post } = storeToRefs(useEditorStore())
const t = computed(() => (props.variant === 't8' ? post.value.t8 : post.value.t6))
const isT8 = computed(() => props.variant === 't8')

const gradientCSS = computed(() => {
  const gs = t.value.gradientStart
  const str = t.value.gradientStrength
  const p2 = (gs + (100 - gs) * 0.2).toFixed(1)
  const p3 = (gs + (100 - gs) * 0.46).toFixed(1)
  const p4 = (gs + (100 - gs) * 0.7).toFixed(1)
  return [
    'transparent 0%',
    `transparent ${gs}%`,
    `rgba(0,0,0,${(str * 0.08).toFixed(2)}) ${p2}%`,
    `rgba(0,0,0,${(str * 0.42).toFixed(2)}) ${p3}%`,
    `rgba(0,0,0,${(str * 0.8).toFixed(2)}) ${p4}%`,
    `rgba(0,0,0,${str}) 100%`,
  ].join(', ')
})

const decoSize = computed(() => Math.round(t.value.swipeFontSize * 0.52))
</script>

<template>
  <div class="sports">
    <div class="photo">
      <CoverImage
        :src="t.bgImage"
        :pos-x="t.imagePosX"
        :pos-y="t.imagePosY"
        :scale="t.imageScale"
        :opacity="t.bgOpacity"
        alt="Background"
      />
    </div>
    <div class="dim" :style="{ background: t.overlayColor, opacity: t.overlayOpacity }" />
    <div class="grad" :style="{ background: `linear-gradient(to bottom, ${gradientCSS})` }" />

    <div
      v-if="t.showCircle"
      class="circle"
      :style="{
        left: `${t.circlePosX}%`,
        top: `${t.circlePosY}%`,
        width: `${t.circleSize}px`,
        height: `${t.circleSize}px`,
        border: `${t.circleBorderWidth}px solid ${t.circleBorderColor}`,
      }"
    >
      <CoverImage v-if="t.circleImage" :src="t.circleImage" alt="Circle inset" />
      <div v-else class="circle-empty">Tap to<br>add photo</div>
    </div>

    <div
      v-if="t.showBrand"
      class="brand"
      :style="{
        fontFamily: `'${t.customBrandFontFamily || t.brandFontFamily}', sans-serif`,
        fontSize: `${t.brandFontSize}px`,
        fontStyle: t.brandItalic ? 'italic' : 'normal',
        letterSpacing: `${t.brandLetterSpacing ?? 0.03}em`,
        color: t.brandColor,
      }"
    >{{ t.brandText }}</div>

    <div class="copy" :style="{ padding: `0 ${t.paddingH}px ${t.paddingBottom}px` }">
      <p :style="{
        fontFamily: `'${t.customFontFamily || t.fontFamily}', sans-serif`,
        fontSize: `${t.fontSize}px`,
        fontWeight: t.fontWeight,
        lineHeight: t.lineHeight,
        letterSpacing: `${t.letterSpacing}em`,
        textAlign: t.textAlign || 'center',
      }">
        <HeadlineMarkup :text="t.headline" :color="t.headlineColor" :highlight="t.highlightColor" />
      </p>
    </div>

    <div class="nav">
      <div v-if="t.showSwipe" class="swipe" :class="{ plain: isT8 }">
        <span v-if="!isT8" class="deco" :style="{ color: t.swipeColor, fontSize: `${decoSize}px` }">›&nbsp;›&nbsp;›</span>
        <span class="swipe-text" :style="{
          fontFamily: `'${t.customSwipeFontFamily || t.swipeFontFamily}', sans-serif`,
          color: t.swipeColor,
          fontSize: `${t.swipeFontSize}px`,
          letterSpacing: `${t.swipeLetterSpacing ?? 0.22}em`,
        }">{{ t.swipeText }}</span>
        <span v-if="!isT8" class="deco" :style="{ color: t.swipeColor, fontSize: `${decoSize}px` }">›&nbsp;›&nbsp;›</span>
      </div>
      <PaginationDots v-if="t.showDots" :count="t.dotCount" :active="t.activeDot" :color="t.dotColor" :active-width="20" :size="7" />
    </div>
  </div>
</template>

<style scoped>
.sports { position: absolute; inset: 0; overflow: hidden; background: #000; }
.photo, .dim, .grad { position: absolute; inset: 0; }
.dim, .grad { pointer-events: none; }
.circle {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  overflow: hidden;
  z-index: 20;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  background: #1a1a1a;
}
.circle img,
.circle video { width: 100%; height: 100%; object-fit: cover; }
.circle-empty {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.3); font-size: 13px; text-align: center; padding: 20px;
}
.brand {
  position: absolute;
  top: 40px; left: 44px;
  z-index: 30;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
}
.copy {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}
.copy p {
  margin: 0;
  align-self: center;
  text-transform: uppercase;
  white-space: pre-wrap;
  text-shadow: 0 4px 15px rgba(0,0,0,0.8);
  word-break: break-word;
  pointer-events: auto;
}
.nav {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 26px;
  gap: 10px;
}
.swipe { display: flex; align-items: center; gap: 13px; }
.swipe.plain { justify-content: center; }
.swipe-text { font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; line-height: 1; }
.deco { opacity: 0.45; letter-spacing: 5px; font-family: sans-serif; line-height: 1; }
</style>
