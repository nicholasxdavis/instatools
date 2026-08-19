<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { textureUrl } from '@/config/media'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'

const { post } = storeToRefs(useEditorStore())
const t16 = computed(() => post.value.t16 || {})

const fontStack = computed(
  () => `'${t16.value.customFontFamily || t16.value.fontFamily || 'Plus Jakarta Sans'}', sans-serif`,
)
const dekFont = computed(
  () => `'${t16.value.customDekFontFamily || t16.value.dekFontFamily || t16.value.fontFamily || 'Plus Jakarta Sans'}', sans-serif`,
)
const padH = computed(() => t16.value.paddingH ?? 72)
const padV = computed(() => t16.value.paddingV ?? 64)
const align = computed(() => t16.value.textAlign || 'left')
const stackAlign = computed(() => {
  if (align.value === 'center') return 'center'
  if (align.value === 'right') return 'flex-end'
  return 'flex-start'
})
const textureSrc = computed(() => textureUrl(t16.value.textureId))
const productBox = computed(() => {
  const widthPct = Math.max(50, Math.min(100, t16.value.productWidth ?? 100))
  const availW = 1080 - padH.value * 2
  const prodW = Math.round(availW * (widthPct / 100))
  const anchorX = (t16.value.productOffsetX ?? 50) / 100
  const prodX = Math.round(padH.value + (availW - prodW) * anchorX)
  const bottom = t16.value.productBottom ?? 56
  const prodH = Math.round(1350 * ((t16.value.productHeight ?? 46) / 100))
  return { prodX, prodW, prodH, bottom, prodY: 1350 - bottom - prodH }
})
const stackStyle = computed(() => {
  const pos = t16.value.headlinePos || 'top'
  const offsetX = t16.value.stackOffsetX ?? 0
  const offsetY = t16.value.stackOffsetY ?? 0
  const base = {
    left: `${padH.value + offsetX}px`,
    right: `${padH.value - offsetX}px`,
    alignItems: stackAlign.value,
    textAlign: align.value,
  }
  if (pos === 'center') {
    return {
      ...base,
      top: '50%',
      transform: `translateY(calc(-50% + ${offsetY}px))`,
    }
  }
  if (pos === 'bottom') {
    const reserve = (t16.value.showProduct ? productBox.value.prodH + productBox.value.bottom + 24 : 0)
    return {
      ...base,
      bottom: `${reserve + padV.value - offsetY}px`,
      top: 'auto',
    }
  }
  return {
    ...base,
    top: `${padV.value + offsetY}px`,
  }
})
</script>

<template>
  <div class="t16" :style="{ background: t16.bgColor || '#FFFFFF', color: t16.headlineColor }">
    <div
      v-if="textureSrc"
      class="texture"
      :style="{
        backgroundImage: `url(${textureSrc})`,
        backgroundSize: `${t16.textureScale ?? 100}%`,
        opacity: t16.textureOpacity ?? 0.35,
      }"
    />

    <div
      v-if="t16.showBlob"
      class="blob"
      :style="{
        left: `${t16.blobPosX}%`,
        top: `${t16.blobPosY}%`,
        width: `${t16.blobWidth}px`,
        height: `${t16.blobHeight}px`,
        background: t16.blobColor,
        borderRadius: `${t16.blobRadius ?? 50}%`,
        transform: `translate(-50%, -50%) rotate(${t16.blobRotate || 0}deg)`,
      }"
    />

    <div
      v-if="t16.showProduct && t16.productUrl"
      class="product"
      :style="{
        left: `${productBox.prodX}px`,
        width: `${productBox.prodW}px`,
        bottom: `${productBox.bottom}px`,
        height: `${t16.productHeight}%`,
        borderRadius: `${t16.productRadius}px`,
        border: t16.productBorder > 0 ? `${t16.productBorder}px solid ${t16.productBorderColor}` : '0',
        boxShadow: t16.showShadow ? `0 ${t16.shadowSize || 28}px ${Math.round((t16.shadowSize || 28) * 2.2)}px ${t16.shadowColor || 'rgba(0,0,0,0.14)'}` : 'none',
      }"
    >
      <CoverImage
        :src="t16.productUrl"
        :pos-x="t16.imagePosX"
        :pos-y="t16.imagePosY"
        :scale="t16.imageScale"
        alt="Product"
      />
    </div>

    <div class="stack" :style="stackStyle">
      <img
        v-if="t16.showLogo && t16.logoUrl"
        class="logo"
        :src="t16.logoUrl"
        alt=""
        :style="{
          width: `${t16.logoSize}px`,
          height: 'auto',
          marginLeft: `${t16.logoOffsetX ?? 0}px`,
          marginTop: `${t16.logoOffsetY ?? 0}px`,
        }"
      />

      <p
        v-if="t16.showKicker"
        class="kicker"
        :style="{
          fontFamily: dekFont,
          fontSize: `${t16.kickerSize}px`,
          color: t16.kickerColor,
          letterSpacing: `${t16.kickerLetterSpacing}em`,
        }"
      >{{ t16.kickerText }}</p>

      <p
        class="headline"
        :class="{ uppercase: t16.uppercase }"
        :style="{
          fontFamily: fontStack,
          fontSize: `${t16.fontSize}px`,
          fontWeight: t16.fontWeight,
          lineHeight: t16.lineHeight,
          letterSpacing: `${t16.letterSpacing}em`,
          textAlign: align,
        }"
      >
        <HeadlineMarkup :text="t16.headline" :color="t16.headlineColor" :highlight="t16.highlightColor" />
      </p>

      <p
        v-if="t16.showDek"
        class="dek"
        :style="{
          fontFamily: dekFont,
          fontSize: `${t16.dekSize}px`,
          fontWeight: t16.dekWeight,
          lineHeight: t16.dekLineHeight,
          letterSpacing: `${t16.dekLetterSpacing}em`,
          color: t16.dekColor,
          textAlign: align,
        }"
      >{{ t16.dek }}</p>

      <div
        v-if="t16.showCta"
        class="cta"
        :style="{
          fontFamily: dekFont,
          fontSize: `${t16.ctaSize}px`,
          fontWeight: t16.ctaWeight,
          color: t16.ctaColor,
          background: t16.ctaBg,
          borderRadius: `${t16.ctaRadius}px`,
          padding: `${t16.ctaPadV}px ${t16.ctaPadH}px`,
          letterSpacing: `${t16.ctaLetterSpacing}em`,
        }"
      >{{ t16.ctaText }}</div>
    </div>
  </div>
</template>

<style scoped>
.t16 { position: absolute; inset: 0; overflow: hidden; }
.texture {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-repeat: repeat;
  background-position: center;
}
.blob {
  position: absolute;
  z-index: 1;
  pointer-events: none;
}
.product {
  position: absolute;
  z-index: 4;
  overflow: hidden;
  background: #fff;
}
.product :deep(img),
.product :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.stack {
  position: absolute;
  z-index: 8;
  display: flex;
  flex-direction: column;
  gap: 0;
  pointer-events: none;
  max-width: 100%;
}
.logo {
  display: block;
  object-fit: contain;
  margin-bottom: 28px;
  pointer-events: auto;
}
.kicker {
  margin: 0 0 14px;
  font-weight: 700;
  text-transform: uppercase;
  pointer-events: auto;
}
.headline {
  margin: 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  pointer-events: auto;
}
.headline.uppercase { text-transform: uppercase; }
.dek {
  margin: 18px 0 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  pointer-events: auto;
}
.cta {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  white-space: nowrap;
  pointer-events: auto;
}
</style>
