<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t15 = computed(() => post.value.t15 || {})

const fontStack = computed(
  () => `'${t15.value.customFontFamily || t15.value.fontFamily || 'Plus Jakarta Sans'}', sans-serif`,
)
const brandFont = computed(
  () => `'${t15.value.customBrandFontFamily || t15.value.brandFontFamily || 'Plus Jakarta Sans'}', sans-serif`,
)
const dekFont = computed(
  () => `'${t15.value.customDekFontFamily || t15.value.dekFontFamily || 'Plus Jakarta Sans'}', sans-serif`,
)
const dots = computed(() => {
  const color = t15.value.patternColor || '#ffffff'
  return `radial-gradient(circle, ${color} 1.15px, transparent 1.2px)`
})
const padH = computed(() => t15.value.paddingH ?? 64)
const padV = computed(() => t15.value.paddingV ?? 72)
const railW = computed(() => (t15.value.showRail ? t15.value.railWidth || 0 : 0))
const shape = computed(() => t15.value.frameShape || 'circle')
const framed = computed(() => shape.value !== 'none')
const fadeBg = computed(() => {
  const strength = t15.value.fadeStrength ?? 0.52
  const hex = t15.value.fadeColor || '#000000'
  const r = parseInt(hex.slice(1, 3), 16) || 0
  const g = parseInt(hex.slice(3, 5), 16) || 0
  const b = parseInt(hex.slice(5, 7), 16) || 0
  return `linear-gradient(to top, transparent 0%, rgba(${r},${g},${b},${strength}) 100%)`
})
const copyOffsetX = computed(() => t15.value.copyOffsetX ?? 0)
const copyOffsetY = computed(() => t15.value.copyOffsetY ?? 0)
const footerBottomPad = computed(() => Math.max(40, padV.value * 0.55))
const footerBlockH = computed(() => {
  if (!t15.value.showFooter) return footerBottomPad.value
  return (t15.value.footerSize ?? 22) + footerBottomPad.value
})
const copyBottomGap = computed(() => t15.value.copyBottomGap ?? 36)
const copyStyle = computed(() => {
  const h = padH.value + copyOffsetX.value
  const v = padV.value
  const pos = t15.value.headlinePos || 'top'
  const brandClear = showBrandBlock.value ? 120 : 0
  const oy = copyOffsetY.value
  const style = {
    left: 0,
    right: `${railW.value}px`,
    paddingLeft: `${h}px`,
    paddingRight: `${h}px`,
  }
  if (pos === 'center') {
    style.top = '50%'
    style.transform = `translateY(calc(-50% + ${oy}px))`
  } else if (pos === 'bottom') {
    style.bottom = `${footerBlockH.value + copyBottomGap.value - oy}px`
    style.top = 'auto'
  } else {
    style.top = `${Math.max(v, brandClear) + oy}px`
  }
  return style
})
const frameRadius = computed(() => {
  if (shape.value === 'circle') return '50%'
  if (shape.value === 'rounded') return `${t15.value.frameRadius ?? 36}px`
  return '0'
})
const subjectGlow = computed(() => {
  if (!t15.value.showSubjectGlow) return 'none'
  const size = t15.value.subjectGlowSize ?? 1.2
  const opacity = t15.value.subjectGlowOpacity ?? 1
  const hex = t15.value.subjectGlowColor || '#FFFFFF'
  const r = parseInt(hex.slice(1, 3), 16) || 255
  const g = parseInt(hex.slice(3, 5), 16) || 255
  const b = parseInt(hex.slice(5, 7), 16) || 255
  const color = `rgba(${r},${g},${b},${opacity})`
  const blur = Math.round(24 * size)
  return `0 0 ${blur}px ${color}, 0 0 ${Math.round(blur * 1.6)}px ${color}`
})
const stackAlign = computed(() => {
  const align = t15.value.textAlign || 'left'
  if (align === 'center') return 'center'
  if (align === 'right') return 'flex-end'
  return 'flex-start'
})
const markMode = computed(() => {
  if (!t15.value.showBrandRow) return 'none'
  return t15.value.markMode || (t15.value.showMark ? 'dots' : 'none')
})
const showBrandBlock = computed(
  () => t15.value.showBrandRow && (markMode.value !== 'none' || t15.value.showBrand),
)
const ctaAlignSelf = computed(() => {
  const a = t15.value.ctaAlign || 'match'
  const resolved = a === 'match' ? (t15.value.textAlign || 'left') : a
  if (resolved === 'center') return 'center'
  if (resolved === 'right') return 'flex-end'
  return 'flex-start'
})
const ctaStyleObj = computed(() => {
  const style = t15.value.ctaStyle || 'fill'
  const base = {
    fontFamily: dekFont.value,
    fontSize: `${t15.value.ctaSize}px`,
    fontWeight: t15.value.ctaWeight,
    letterSpacing: `${t15.value.ctaLetterSpacing}em`,
    alignSelf: ctaAlignSelf.value,
    marginTop: `${t15.value.ctaMarginTop ?? 12}px`,
    transform: `translate(${t15.value.ctaOffsetX ?? 0}px, ${t15.value.ctaOffsetY ?? 0}px)`,
  }
  if (t15.value.ctaFullWidth) base.width = '100%'
  if (style === 'fill') {
    base.color = t15.value.ctaColor
    base.background = t15.value.ctaBg
    base.borderRadius = `${t15.value.ctaRadius}px`
    base.padding = `${t15.value.ctaPadV}px ${t15.value.ctaPadH}px`
  } else if (style === 'outline') {
    base.color = t15.value.ctaColor
    base.background = 'transparent'
    base.border = `${t15.value.ctaBorder ?? 2}px solid ${t15.value.ctaBorderColor || t15.value.ctaBg}`
    base.borderRadius = `${t15.value.ctaRadius}px`
    base.padding = `${t15.value.ctaPadV}px ${t15.value.ctaPadH}px`
  } else if (style === 'underline') {
    base.color = t15.value.ctaColor || t15.value.ctaBg
    base.background = 'transparent'
    base.padding = '4px 0 0'
    base.borderBottom = `2px solid ${t15.value.ctaBg || t15.value.ctaBorderColor}`
  } else {
    base.color = t15.value.ctaColor || '#FFFFFF'
    base.background = 'transparent'
    base.padding = '4px 0'
  }
  return base
})
const fadeBgBottom = computed(() => {
  const strength = t15.value.bottomFadeStrength ?? 0.52
  const hex = t15.value.fadeColor || '#000000'
  const r = parseInt(hex.slice(1, 3), 16) || 0
  const g = parseInt(hex.slice(3, 5), 16) || 0
  const b = parseInt(hex.slice(5, 7), 16) || 0
  return `linear-gradient(to bottom, transparent 0%, rgba(${r},${g},${b},${strength}) 100%)`
})
</script>

<template>
  <div class="t15" :style="{ background: t15.bgColor || '#111', color: t15.headlineColor }">
    <div class="photo">
      <CoverImage
        :src="t15.bgImage"
        :pos-x="t15.imagePosX"
        :pos-y="t15.imagePosY"
        :scale="t15.imageScale"
        :opacity="t15.bgOpacity ?? 1"
        alt="Background"
      />
    </div>

    <div
      v-if="(t15.fadeHeight || 0) > 0 && (t15.fadeStrength || 0) > 0"
      class="fade fade-top"
      :style="{ height: `${t15.fadeHeight}%`, background: fadeBg }"
    />
    <div
      v-if="t15.showBottomFade && (t15.bottomFadeHeight || 0) > 0 && (t15.bottomFadeStrength || 0) > 0"
      class="fade fade-bottom"
      :style="{ height: `${t15.bottomFadeHeight}%`, background: fadeBgBottom }"
    />
    <div class="dim" :style="{ backgroundColor: t15.overlayColor, opacity: t15.overlayOpacity }" />

    <div
      v-if="t15.showPattern"
      class="dots"
      :style="{
        backgroundImage: dots,
        backgroundSize: `${t15.patternSize || 28}px ${t15.patternSize || 28}px`,
        opacity: t15.patternOpacity ?? 0.14,
      }"
    />

    <div
      v-if="t15.showRail"
      class="rail"
      :style="{
        width: `${t15.railWidth}px`,
        background: t15.railColor || t15.accentColor,
      }"
    />

    <div
      v-if="t15.showSubject && t15.subjectUrl"
      class="subject"
      :class="shape"
      :style="{
        left: `${t15.subjectPosX}%`,
        top: `${t15.subjectPosY}%`,
        width: `${t15.subjectSize}px`,
        height: framed ? `${t15.subjectSize}px` : 'auto',
        borderRadius: frameRadius,
        border: t15.frameBorder > 0 ? `${t15.frameBorder}px solid ${t15.frameBorderColor}` : '0',
        filter: t15.grayscale ? 'grayscale(1)' : 'none',
        boxShadow: subjectGlow,
      }"
    >
      <CoverImage
        :src="t15.subjectUrl"
        :pos-x="t15.subjectImagePosX"
        :pos-y="t15.subjectImagePosY"
        :scale="t15.subjectImageScale"
        :fit="framed ? 'cover' : 'contain'"
        alt="Subject"
      />
    </div>

    <div
      v-if="showBrandBlock"
      class="brand"
      :style="{
        top: `${Math.round(padV * 0.72) + (t15.brandPosY ?? 0)}px`,
        left: `${padH + (t15.brandPosX ?? 0)}px`,
        fontFamily: brandFont,
        color: t15.brandColor,
      }"
    >
      <div
        v-if="markMode === 'dots'"
        class="mark"
        :style="{ '--mark': t15.accentColor, width: `${t15.markSize}px`, height: `${t15.markSize}px` }"
      >
        <span /><span /><span /><span />
      </div>
      <img
        v-else-if="markMode === 'image' && t15.markImageUrl"
        class="mark-img"
        :src="t15.markImageUrl"
        alt=""
        :style="{ width: `${t15.markSize}px`, height: `${t15.markSize}px` }"
      />
      <span
        v-if="t15.showBrand"
        class="brand-name"
        :style="{ fontSize: `${t15.brandSize}px`, letterSpacing: `${t15.brandLetterSpacing}em`, fontWeight: t15.brandWeight }"
      >{{ t15.brandText }}</span>
    </div>

    <div class="copy" :style="copyStyle">
      <div class="copy-stack" :style="{ alignItems: stackAlign, textAlign: t15.textAlign || 'left' }">
        <p
          v-if="t15.showKicker"
          class="kicker"
          :style="{
            fontFamily: brandFont,
            fontSize: `${t15.kickerSize}px`,
            color: t15.kickerColor,
            letterSpacing: `${t15.kickerLetterSpacing}em`,
          }"
        >{{ t15.kickerText }}</p>
        <p
          class="headline"
          :class="{ uppercase: t15.uppercase }"
          :style="{
            fontFamily: fontStack,
            fontSize: `${t15.fontSize}px`,
            fontWeight: t15.fontWeight,
            lineHeight: t15.lineHeight,
            letterSpacing: `${t15.letterSpacing}em`,
          }"
        >
          <HeadlineMarkup :text="t15.headline" :color="t15.headlineColor" :highlight="t15.highlightColor" />
        </p>
        <p
          v-if="t15.showDek"
          class="dek"
          :style="{
            fontFamily: dekFont,
            fontSize: `${t15.dekSize}px`,
            fontWeight: t15.dekWeight,
            lineHeight: t15.dekLineHeight,
            letterSpacing: `${t15.dekLetterSpacing}em`,
            color: t15.dekColor,
          }"
        >{{ t15.dek }}</p>
        <div
          v-if="t15.showCta"
          class="cta"
          :class="{ 'cta-full': t15.ctaFullWidth }"
          :style="ctaStyleObj"
        >{{ t15.ctaText }}</div>
      </div>
    </div>

    <div
      v-if="t15.showFooter"
      class="footer"
      :style="{
        fontFamily: brandFont,
        fontSize: `${t15.footerSize}px`,
        color: t15.footerColor,
        letterSpacing: `${t15.footerLetterSpacing}em`,
        padding: `0 ${padH}px ${footerBottomPad}px`,
        paddingRight: `${padH + railW}px`,
      }"
    >
      <span>{{ t15.footerLeft }}</span>
      <span v-if="t15.footerRight">{{ t15.footerRight }}</span>
    </div>

    <WatermarkLayer
      :src="t15.watermarkUrl"
      :size="t15.watermarkSize"
      :opacity="t15.watermarkOpacity"
      :pos-x="t15.watermarkPosX"
      :pos-y="t15.watermarkPosY"
      :visible="t15.showWatermark"
    />
  </div>
</template>

<style scoped>
.t15 { position: absolute; inset: 0; overflow: hidden; }
.photo, .dim, .dots, .rail, .fade { position: absolute; pointer-events: none; }
.photo, .dim, .dots { inset: 0; }
.photo { z-index: 0; }
.fade {
  left: 0;
  right: 0;
  z-index: 1;
}
.fade-top { top: 0; }
.fade-bottom {
  bottom: 0;
  top: auto;
}
.dim { z-index: 2; }
.dots { z-index: 3; }
.rail {
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
}
.subject {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 6;
  overflow: hidden;
  background: transparent;
}
.subject.circle,
.subject.rounded,
.subject.hex { aspect-ratio: 1; }
.subject.hex {
  clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
}
.subject :deep(img),
.subject :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.subject.none :deep(img),
.subject.none :deep(video) {
  height: auto;
  object-fit: contain;
}
.brand {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14px;
}
.mark {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14%;
  flex-shrink: 0;
}
.mark span {
  display: block;
  border-radius: 50%;
  background: var(--mark);
  aspect-ratio: 1;
}
.brand-name { line-height: 1; }
.mark-img {
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}
.copy {
  position: absolute;
  left: 0;
  z-index: 18;
  pointer-events: none;
  max-width: 100%;
}
.copy-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  pointer-events: none;
}
.kicker {
  margin: 0;
  width: 100%;
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
  margin: 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  pointer-events: auto;
}
.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  white-space: nowrap;
  width: auto;
  max-width: 100%;
  pointer-events: auto;
  box-sizing: border-box;
}
.cta-full {
  justify-content: center;
}
.footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-weight: 500;
}
</style>
