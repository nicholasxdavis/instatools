<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'
import WatermarkLayer from '../shared/WatermarkLayer.vue'

const { post } = storeToRefs(useEditorStore())
const t = computed(() => post.value.t23 || {})

const fontStack = computed(
  () => `'${t.value.customFontFamily || t.value.fontFamily || 'Impact'}', Haettenschweiler, 'Arial Narrow', sans-serif`,
)
const metaFont = computed(
  () => `'${t.value.customMetaFontFamily || t.value.metaFontFamily || 'Impact'}', Haettenschweiler, 'Arial Narrow', sans-serif`,
)
const imagePct = computed(() => Math.min(75, Math.max(50, t.value.imageSplit ?? 64)))
const dual = computed(() => t.value.showDual !== false)
</script>

<template>
  <div class="t23">
    <div class="photos" :style="{ height: `${imagePct}%` }">
      <div
        class="slot"
        :style="dual ? { flex: `0 0 ${t.leftWidth ?? 50}%` } : { flex: '1 1 auto' }"
      >
        <CoverImage
          :src="t.imageLeft"
          :pos-x="t.leftPosX"
          :pos-y="t.leftPosY"
          :scale="t.leftScale"
          :opacity="t.bgOpacity ?? 1"
          alt="Left"
        />
      </div>
      <div
        v-if="dual"
        class="slot"
        :style="t.imageSeparator ? { borderLeft: `${t.separatorWidth || 2}px solid ${t.separatorColor || '#000'}` } : null"
      >
        <CoverImage
          :src="t.imageRight || t.imageLeft"
          :pos-x="t.rightPosX"
          :pos-y="t.rightPosY"
          :scale="t.rightScale"
          :opacity="t.bgOpacity ?? 1"
          alt="Right"
        />
      </div>

      <div
        v-if="t.showRibbon !== false"
        class="corner"
        :style="{
          background: t.ribbonColor || '#000000',
          width: `${t.ribbonSize || 140}px`,
          height: `${t.ribbonSize || 140}px`,
        }"
      >
        <div class="corner-mark" :style="{ width: `${t.logoSize || 60}px` }">
          <img v-if="t.logoUrl" :src="t.logoUrl" alt="" />
          <svg v-else viewBox="0 0 64 64" aria-hidden="true">
            <path fill="#ba5518" d="M18 10h28l-5 8H23z"/>
            <path fill="#ba5518" d="M24 4h16l-3 5H27z"/>
            <path fill="#ba5518" d="M8 52V20h9l8 20 8-20h9l8 20 8-20h9v32h-10V34L41 52H32l-8-18-8 18H7L0 34v18z"/>
          </svg>
        </div>
      </div>
    </div>

    <div
      class="footer"
      :style="{
        background: t.footerBg || '#000000',
        padding: `${t.paddingTop ?? 34}px ${t.paddingH ?? 52}px ${t.paddingBottom ?? 26}px`,
      }"
    >
      <div
        v-if="t.showBadge !== false"
        class="badge"
        :style="{
          background: t.badgeBg || '#ba5518',
          color: t.badgeColor || '#FFFFFF',
          fontFamily: metaFont,
          fontSize: `${t.badgeSize || 20}px`,
          letterSpacing: `${t.badgeLetterSpacing ?? 0.06}em`,
          top: `${t.badgeOffset ?? -14}px`,
        }"
      >
        {{ t.badgeText || 'VIA NOBODY' }}
      </div>

      <p
        class="headline"
        :style="{
          fontFamily: fontStack,
          fontSize: `${t.fontSize || 72}px`,
          fontWeight: t.fontWeight || 400,
          color: t.headlineColor || '#FFFFFF',
          lineHeight: t.lineHeight ?? 0.98,
          letterSpacing: `${t.letterSpacing ?? -0.01}em`,
          textTransform: t.uppercase !== false ? 'uppercase' : 'none',
          textAlign: t.textAlign || 'center',
        }"
      >
        <HeadlineMarkup
          :text="t.headline"
          :color="t.headlineColor || '#FFFFFF'"
          :highlight="t.highlightColor || '#CC0000'"
        />
      </p>

      <div
        v-if="t.showSite !== false"
        class="site-row"
      >
        <span class="rule" :style="{ background: t.siteRuleColor || '#ba5518' }" />
        <span
          class="site"
          :style="{
            fontFamily: metaFont,
            fontSize: `${t.siteSize || 13}px`,
            color: t.siteColor || '#C8C8C8',
            letterSpacing: `${t.siteLetterSpacing ?? 0.16}em`,
          }"
        >{{ t.siteText || 'WORLDSTAR.COM' }}</span>
        <span class="rule" :style="{ background: t.siteRuleColor || '#ba5518' }" />
      </div>
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
.t23 {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #000;
  overflow: hidden;
}
.photos {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  overflow: hidden;
  background: #111;
}
.slot {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.corner {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 8;
  clip-path: polygon(0 0, 100% 0, 0 100%);
  pointer-events: none;
}
.corner-mark {
  position: absolute;
  top: 16px;
  left: 14px;
}
.corner-mark img,
.corner-mark svg {
  display: block;
  width: 100%;
  height: auto;
}
.footer {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  min-height: 0;
}
.badge {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  padding: 6px 12px 5px;
  font-weight: 400;
  text-transform: uppercase;
  white-space: nowrap;
  line-height: 1;
  pointer-events: auto;
}
.headline {
  margin: 8px 0 0;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  pointer-events: auto;
}
.site-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: min(100%, 340px);
  margin-top: 18px;
  pointer-events: auto;
}
.rule {
  flex: 1 1 32px;
  max-width: 58px;
  height: 2px;
}
.site {
  flex: 0 0 auto;
  font-weight: 400;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
