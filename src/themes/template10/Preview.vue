<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { getGrainDataUrl } from '@/export/filter'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t10 = computed(() => post.value.t10)
const grainUrl = computed(() => (t10.value.noiseAmount > 0 ? getGrainDataUrl(180) : ''))
const glowHeight = computed(() => Math.max(0, Math.min(100, t10.value.glowHeight || 40)))
const glowOpacity = computed(() => Math.max(0, Math.min(1, t10.value.glowOpacity ?? 0.8)))
const decoSize = computed(() => Math.round((t10.value.swipeFontSize || 26) * 0.52))
</script>

<template>
  <div class="t10">
    <div class="photo">
      <CoverImage :src="t10.bgImage" :pos-x="t10.imagePosX ?? 50" :pos-y="t10.imagePosY || 50" :scale="t10.imageScale || 100" alt="Background" />
    </div>
    <div class="fade" :style="{ height: `${t10.fadeHeight}%`, background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,${t10.fadeStrength}) 100%)` }" />
    <div class="overlay" :style="{ background: t10.overlayColor, opacity: t10.overlayOpacity }" />
    <div
      v-if="t10.noiseAmount > 0"
      class="grain"
      :style="{
        backgroundImage: `url('${grainUrl}')`,
        opacity: Math.min(1, t10.noiseAmount * 1.6),
      }"
    />
    <div class="glow" :style="{ height: `${glowHeight}%` }">
      <div :style="{
        width: '140%',
        height: '260px',
        background: `radial-gradient(circle at 50% 0%, rgba(0,0,0,${glowOpacity}) 0%, rgba(0,0,0,${glowOpacity * 0.7}) 32%, transparent 78%)`,
        filter: 'blur(46px)',
        transform: 'translateY(34px)',
      }" />
    </div>

    <div class="copy" :style="{ padding: `0 ${t10.paddingH}px ${t10.paddingBottom}px` }">
      <p
        class="effect-grunge"
        :style="{
          fontFamily: `'${t10.customFontFamily || t10.fontFamily}', system-ui`,
          fontSize: `${t10.fontSize}px`,
          fontWeight: t10.fontWeight,
          lineHeight: t10.lineHeight,
          letterSpacing: `${t10.letterSpacing || 0}em`,
          textAlign: t10.textAlign || 'center',
          color: t10.headlineColor,
        }"
      >
        <HeadlineMarkup :text="t10.headline" :color="t10.headlineColor" :highlight="t10.highlightColor" />
      </p>
    </div>

    <div v-if="t10.showSwipe" class="swipe-wrap">
      <div class="swipe">
        <template v-if="t10.swipeStyle === 'chevron'">
          <span class="deco" :style="{ color: t10.swipeColor, fontSize: `${decoSize}px` }">›&nbsp;›&nbsp;›</span>
          <span class="swipe-text" :style="{ fontFamily: `'${t10.swipeCustomFontFamily || t10.swipeFontFamily || t10.fontFamily}', system-ui`, color: t10.swipeColor, fontSize: `${t10.swipeFontSize}px`, letterSpacing: `${t10.swipeLetterSpacing ?? 0.24}em` }">{{ t10.swipeText }}</span>
          <span class="deco" :style="{ color: t10.swipeColor, fontSize: `${decoSize}px` }">›&nbsp;›&nbsp;›</span>
        </template>
        <span
          v-else-if="t10.swipeStyle === 'badge'"
          class="swipe-text badge"
          :style="{ fontFamily: `'${t10.swipeCustomFontFamily || t10.swipeFontFamily || t10.fontFamily}', system-ui`, color: t10.swipeColor, fontSize: `${t10.swipeFontSize}px`, borderColor: t10.swipeColor, letterSpacing: `${t10.swipeLetterSpacing ?? 0.24}em` }"
        >{{ t10.swipeText }}</span>
        <span
          v-else
          class="swipe-text"
          :style="{ fontFamily: `'${t10.swipeCustomFontFamily || t10.swipeFontFamily || t10.fontFamily}', system-ui`, color: t10.swipeColor, fontSize: `${t10.swipeFontSize}px`, letterSpacing: `${t10.swipeLetterSpacing ?? 0.24}em` }"
        >{{ t10.swipeText }}</span>
      </div>
    </div>

    <WatermarkLayer
      :src="t10.watermarkUrl"
      :size="t10.watermarkSize"
      :opacity="t10.watermarkOpacity"
      :pos-x="t10.watermarkPosX"
      :pos-y="t10.watermarkPosY"
      :visible="t10.showWatermark !== false"
    />
  </div>
</template>

<style scoped>
.t10 { position: absolute; inset: 0; background: #f4f4f4; overflow: hidden; }
.photo, .overlay { position: absolute; inset: 0; }
.fade { position: absolute; left: 0; right: 0; bottom: 0; pointer-events: none; }
.overlay { pointer-events: none; }
.grain {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  mix-blend-mode: multiply;
  background-size: 180px 180px;
  background-repeat: repeat;
  filter: contrast(1.6) brightness(1.05);
}
.glow {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}
.copy {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  z-index: 30;
  pointer-events: none;
}
.copy p {
  margin: 0;
  opacity: 0.85;
  text-transform: uppercase;
  pointer-events: auto;
}
.swipe-wrap {
  position: absolute;
  left: 0; right: 0; bottom: 30px;
  display: flex;
  justify-content: center;
  z-index: 36;
}
.swipe { display: flex; align-items: center; }
.swipe-text {
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  line-height: 1;
}
.swipe-text.badge {
  border: 1.5px solid;
  border-radius: 3px;
  padding: 4px 14px;
  letter-spacing: 0.3em;
}
.deco { opacity: 0.45; letter-spacing: 5px; font-family: sans-serif; line-height: 1; margin: 0 10px; }
</style>
