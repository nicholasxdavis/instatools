<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t11 = computed(() => post.value.t11)
const atTop = computed(() => t11.value.headlinePos === 'top')
const fontStack = computed(() =>
  `'${t11.value.customFontFamily || t11.value.fontFamily}', Georgia, serif`,
)
const fadeBg = computed(() => {
  const strength = t11.value.fadeStrength ?? 0.42
  return atTop.value
    ? `linear-gradient(to top, transparent 0%, rgba(0,0,0,${strength}) 100%)`
    : `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,${strength}) 100%)`
})
const copyPad = computed(() =>
  atTop.value
    ? `${t11.value.paddingV}px ${t11.value.paddingH}px 0`
    : `0 ${t11.value.paddingH}px ${t11.value.paddingV}px`,
)
</script>

<template>
  <div class="t11">
    <div class="photo">
      <CoverImage
        :src="t11.bgImage"
        :pos-x="t11.imagePosX"
        :pos-y="t11.imagePosY"
        :scale="t11.imageScale"
        alt="Background"
      />
    </div>
    <div
      class="fade"
      :class="atTop ? 'top' : 'bottom'"
      :style="{ height: `${t11.fadeHeight}%`, background: fadeBg }"
    />
    <div class="dim" :style="{ backgroundColor: t11.overlayColor, opacity: t11.overlayOpacity }" />

    <div class="copy" :class="atTop ? 'top' : 'bottom'" :style="{ padding: copyPad }">
      <p
        :style="{
          fontFamily: fontStack,
          fontSize: `${t11.fontSize}px`,
          fontWeight: t11.fontWeight,
          fontStyle: t11.fontItalic ? 'italic' : 'normal',
          color: t11.headlineColor,
          lineHeight: t11.lineHeight,
          letterSpacing: `${t11.letterSpacing || 0}em`,
          textAlign: t11.textAlign || 'center',
        }"
      >
        <HeadlineMarkup :text="t11.headline" :color="t11.headlineColor" :highlight="t11.highlightColor" />
      </p>
    </div>

    <WatermarkLayer
      :src="t11.watermarkUrl"
      :size="t11.watermarkSize"
      :opacity="t11.watermarkOpacity"
      :pos-x="t11.watermarkPosX"
      :pos-y="t11.watermarkPosY"
      :visible="t11.showWatermark"
    />
  </div>
</template>

<style scoped>
.t11 { position: absolute; inset: 0; background: #000; overflow: hidden; }
.photo, .dim { position: absolute; inset: 0; }
.dim { pointer-events: none; }
.fade {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
}
.fade.top { top: 0; }
.fade.bottom { bottom: 0; }
.copy {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 20;
  pointer-events: none;
}
.copy.top { top: 0; }
.copy.bottom { bottom: 0; }
.copy p {
  margin: 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  pointer-events: auto;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
}
</style>
