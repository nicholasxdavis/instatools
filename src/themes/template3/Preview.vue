<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { POST_HEIGHT } from '@/config/constants'
import CoverImage from '../shared/CoverImage.vue'

const { post } = storeToRefs(useEditorStore())
const t3 = computed(() => post.value.t3)
const imgHeight = computed(() => Math.round((t3.value.imageSplit / 100) * POST_HEIGHT))
const circleSize = computed(() => Math.round(t3.value.brandSize * 1.4))
const showBg = computed(() => t3.value.showBgColor !== false)
const divider = computed(() => {
  const w = t3.value.dividerWidth ?? 1.5
  return `background:linear-gradient(to right, transparent 0%, ${t3.value.brandColor} 20%, ${t3.value.brandColor} 80%, transparent 100%);height:${w}px;flex:1;`
})
</script>

<template>
  <div class="t3" :style="{ background: showBg ? t3.bgColor : '#000' }">
    <div class="photo" :style="showBg ? { height: `${imgHeight}px` } : { bottom: 0 }">
      <CoverImage
        :src="t3.bgImage"
        :pos-x="t3.imagePosX"
        :pos-y="t3.imagePosY"
        :scale="t3.imageScale"
        alt="Background"
      />
      <div
        v-if="t3.showBottomFade"
        class="fade"
        :style="{
          bottom: `calc(${showBg ? '-2px' : '0px'} + ${-(t3.bottomFadePosY || 0)}px)`,
          height: `${t3.bottomFadeHeight}%`,
          background: `linear-gradient(to bottom, transparent 0%, ${t3.bottomFadeColor} 100%)`,
          opacity: t3.bottomFadeOpacity,
        }"
      />
    </div>

    <div class="content">
      <div
        class="spacer"
        :style="{
          height: `${imgHeight}px`,
          background: showBg ? `linear-gradient(to bottom, transparent 70%, ${t3.bgColor} 100%)` : 'transparent',
        }"
      />

      <div
        v-if="t3.showBrand"
        class="brand"
        :style="{ background: showBg ? t3.bgColor : 'transparent' }"
      >
        <div :style="divider" />
        <div class="brand-inner">
          <span
            v-if="t3.showBrandLetter !== false"
            class="letter"
            :style="{
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              border: `${t3.letterBorderWidth ?? 1.5}px solid ${t3.brandColor}`,
              fontSize: `${t3.brandSize * 0.7}px`,
              color: t3.brandColor,
            }"
          >{{ (t3.brandLetter || 'w').charAt(0) }}</span>
          <span class="name" :style="{ fontSize: `${t3.brandSize}px`, color: t3.brandColor, letterSpacing: `${t3.brandLetterSpacing ?? 0.04}em` }">{{ t3.brandName }}</span>
        </div>
        <div :style="divider" />
      </div>
      <div v-else class="brand-gap" :style="{ background: showBg ? t3.bgColor : 'transparent' }" />

      <div class="headline-wrap" :style="{ background: showBg ? t3.bgColor : 'transparent' }">
        <p :style="{
          fontFamily: `'${t3.customFontFamily || t3.fontFamily}', sans-serif`,
          fontSize: `${t3.fontSize}px`,
          fontWeight: t3.fontWeight,
          fontStyle: t3.fontStyle,
          color: t3.headlineColor,
          lineHeight: t3.lineHeight,
          letterSpacing: `${t3.letterSpacing}em`,
        }">{{ t3.headline }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.t3 { position: absolute; inset: 0; overflow: hidden; }
.photo { position: absolute; top: 0; left: 0; right: 0; overflow: hidden; }
.fade { position: absolute; left: 0; right: 0; pointer-events: none; }
.content { position: absolute; inset: 0; display: flex; flex-direction: column; pointer-events: none; }
.spacer { flex-shrink: 0; }
.brand {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 18px 52px;
  flex-shrink: 0;
  pointer-events: auto;
}
.brand-inner { display: flex; align-items: center; gap: 6px; padding: 0 18px; white-space: nowrap; }
.letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-family: Georgia, serif;
  font-style: italic;
  line-height: 1;
}
.name {
  font-family: Georgia, serif;
  font-style: italic;
  letter-spacing: 0.04em;
  line-height: 1;
}
.brand-gap { height: 24px; flex-shrink: 0; }
.headline-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 52px 40px;
  pointer-events: auto;
}
.headline-wrap p {
  margin: 0;
  text-align: center;
  text-transform: uppercase;
  word-break: break-word;
}
</style>
