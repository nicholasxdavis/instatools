<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t13 = computed(() => post.value.t13)

const fontStack = computed(
  () => `'${t13.value.customFontFamily || t13.value.fontFamily}', 'Arial Narrow', sans-serif`,
)
const metaFont = computed(
  () => `'${t13.value.customMetaFontFamily || t13.value.metaFontFamily}', Inter, sans-serif`,
)
const fadeBg = computed(() => {
  const strength = t13.value.fadeStrength ?? 0.88
  return `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,${strength * 0.35}) 42%, rgba(0,0,0,${strength}) 100%)`
})
</script>

<template>
  <div class="t13">
    <div class="photo">
      <CoverImage
        :src="t13.bgImage"
        :pos-x="t13.imagePosX"
        :pos-y="t13.imagePosY"
        :scale="t13.imageScale"
        alt="Background"
      />
    </div>

    <div
      class="fade"
      :style="{ height: `${t13.fadeHeight}%`, background: fadeBg }"
    />
    <div
      class="dim"
      :style="{ backgroundColor: t13.overlayColor, opacity: t13.overlayOpacity }"
    />
    <div
      class="vignette"
      :style="{ opacity: t13.vignetteOpacity }"
    />

    <div
      v-if="t13.showRail"
      class="rail"
      :style="{
        width: `${t13.railWidth}px`,
        background: t13.accentColor,
        left: `${t13.railInset}px`,
      }"
    />

    <div
      class="copy"
      :style="{
        padding: `0 ${t13.paddingH}px ${t13.paddingBottom}px`,
        paddingLeft: `${t13.paddingH + (t13.showRail ? t13.railWidth + t13.railInset + 18 : 0)}px`,
      }"
    >
      <div
        v-if="t13.showKicker"
        class="kicker"
        :style="{
          background: t13.kickerBg,
          color: t13.kickerColor,
          fontFamily: metaFont,
          fontSize: `${t13.kickerSize}px`,
          letterSpacing: `${t13.kickerLetterSpacing}em`,
        }"
      >
        <span
          v-if="t13.showPulse"
          class="pulse"
          :style="{
            background: t13.pulseColor || t13.accentColor,
            color: t13.pulseColor || t13.accentColor,
          }"
        />
        <span class="kicker-text">{{ t13.kickerText }}</span>
      </div>

      <p
        class="headline"
        :style="{
          fontFamily: fontStack,
          fontSize: `${t13.fontSize}px`,
          fontWeight: t13.fontWeight,
          color: t13.headlineColor,
          lineHeight: t13.lineHeight,
          letterSpacing: `${t13.letterSpacing}em`,
          textAlign: t13.textAlign,
          textTransform: t13.uppercase ? 'uppercase' : 'none',
        }"
      >
        <HeadlineMarkup
          :text="t13.headline"
          :color="t13.headlineColor"
          :highlight="t13.highlightColor"
        />
      </p>

      <div
        v-if="t13.showRule"
        class="rule"
        :class="t13.textAlign || 'left'"
        :style="{
          background: t13.ruleColor || t13.accentColor,
          width: `${t13.ruleWidth}%`,
          height: `${t13.ruleHeight}px`,
        }"
      />

      <p
        v-if="t13.showDek && t13.dek"
        class="dek"
        :style="{
          fontFamily: metaFont,
          fontSize: `${t13.dekSize}px`,
          fontWeight: t13.dekWeight,
          color: t13.dekColor,
          lineHeight: t13.dekLineHeight,
          letterSpacing: `${t13.dekLetterSpacing}em`,
          textAlign: t13.textAlign,
        }"
      >
        {{ t13.dek }}
      </p>

      <div
        v-if="t13.showMeta"
        class="meta"
        :style="{
          fontFamily: metaFont,
          fontSize: `${t13.metaSize}px`,
          color: t13.metaColor,
          letterSpacing: `${t13.metaLetterSpacing}em`,
          justifyContent:
            t13.textAlign === 'center' ? 'center'
            : t13.textAlign === 'right' ? 'flex-end'
            : 'flex-start',
        }"
      >
        <span v-if="t13.metaLeft">{{ t13.metaLeft }}</span>
        <span v-if="t13.metaLeft && t13.metaRight" class="dot" :style="{ background: t13.accentColor }" />
        <span v-if="t13.metaRight">{{ t13.metaRight }}</span>
      </div>
    </div>

    <WatermarkLayer
      :src="t13.watermarkUrl"
      :size="t13.watermarkSize"
      :opacity="t13.watermarkOpacity"
      :pos-x="t13.watermarkPosX"
      :pos-y="t13.watermarkPosY"
      :visible="t13.showWatermark"
    />
  </div>
</template>

<style scoped>
.t13 {
  position: absolute;
  inset: 0;
  background: #050505;
  overflow: hidden;
}
.photo,
.dim,
.vignette {
  position: absolute;
  inset: 0;
}
.dim,
.vignette,
.fade {
  pointer-events: none;
}
.fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
.vignette {
  background:
    radial-gradient(ellipse at center, transparent 38%, rgba(0, 0, 0, 0.72) 100%);
}
.rail {
  position: absolute;
  top: 72px;
  bottom: 72px;
  border-radius: 99px;
  z-index: 25;
  box-shadow: 0 0 28px color-mix(in srgb, currentColor 35%, transparent);
}
.copy {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 22px;
  pointer-events: none;
}
.kicker {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px 10px 14px;
  border-radius: 999px;
  font-weight: 800;
  text-transform: uppercase;
  line-height: 1;
  pointer-events: auto;
}
.pulse {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  color: inherit;
  box-shadow: 0 0 0 0 currentColor;
  animation: pulse 1.6s ease-out infinite;
}
.kicker-text {
  transform: translateY(0.5px);
}
.headline {
  margin: 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  pointer-events: auto;
  text-shadow: 0 8px 40px rgba(0, 0, 0, 0.55);
}
.rule {
  border: 0;
  border-radius: 99px;
  flex-shrink: 0;
}
.rule.center { margin-left: auto; margin-right: auto; }
.rule.right { margin-left: auto; }
.dek {
  margin: 0;
  max-width: 92%;
  pointer-events: auto;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.45);
}
.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  text-transform: uppercase;
  pointer-events: auto;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  opacity: 0.95;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 55%, transparent); }
  70% { box-shadow: 0 0 0 14px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .pulse { animation: none; }
}
</style>
