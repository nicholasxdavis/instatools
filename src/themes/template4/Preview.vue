<script setup>
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import PaginationDots from '../shared/PaginationDots.vue'

const { post } = storeToRefs(useEditorStore())
</script>

<template>
  <div class="t4">
    <div class="photo">
      <CoverImage
        :src="post.t4.bgImage"
        :pos-x="post.t4.imagePosX"
        :pos-y="post.t4.imagePosY"
        :scale="post.t4.imageScale"
        alt="Background"
      />
    </div>
    <div class="grad" :style="{ background: `linear-gradient(to bottom, transparent 0%, transparent ${100 - post.t4.gradientStrength}%, rgba(0,0,0,0.92) 100%)` }" />
    <div class="dim" :style="{ backgroundColor: post.t4.overlayColor, opacity: post.t4.overlayOpacity }" />

    <div v-if="post.t4.showBrand" class="brand">
      <div class="brand-box" :style="{ background: post.t4.brandBgColor }">
        <span :style="{ fontSize: `${post.t4.brandFontSize}px`, color: post.t4.brandTextColor, letterSpacing: `${post.t4.brandLetterSpacing ?? -0.01}em` }">{{ post.t4.brandText }}</span>
      </div>
    </div>

    <div class="bottom">
      <div v-if="post.t4.showBadge" class="badge">{{ post.t4.badgeText }}</div>
      <p :style="{
        fontFamily: `'${post.t4.customFontFamily || post.t4.fontFamily}', sans-serif`,
        fontSize: `${post.t4.fontSize}px`,
        fontWeight: post.t4.fontWeight,
        color: post.t4.headlineColor,
        lineHeight: post.t4.lineHeight,
        letterSpacing: `${post.t4.letterSpacing}em`,
        textAlign: post.t4.textAlign || 'left',
      }">{{ post.t4.headline }}</p>
      <div class="cta">
        <div
          v-if="post.t4.showDivider"
          class="divider"
          :style="{
            background: post.t4.dividerColor,
            height: `${post.t4.dividerWidth ?? 1.5}px`,
            opacity: post.t4.dividerOpacity ?? 0.6,
          }"
        />
        <div
          v-if="post.t4.showSwipe"
          class="swipe"
          :style="{ fontSize: `${post.t4.swipeFontSize}px`, color: post.t4.swipeColor, letterSpacing: `${post.t4.swipeLetterSpacing ?? 0.18}em` }"
        >{{ post.t4.swipeText }}</div>
        <PaginationDots
          v-if="post.t4.showDots"
          :count="post.t4.dotCount"
          :active="post.t4.activeDot"
          :color="post.t4.dotColor"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.t4 { position: absolute; inset: 0; background: #000; overflow: hidden; }
.photo, .grad, .dim { position: absolute; inset: 0; }
.grad, .dim { pointer-events: none; }
.brand { position: absolute; top: 40px; left: 40px; z-index: 30; }
.brand-box { padding: 8px 14px; display: inline-block; }
.brand-box span {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 900;
  letter-spacing: -0.01em;
  line-height: 1;
  display: block;
}
.bottom {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 20;
  padding: 0 60px 52px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.badge {
  background: #fff;
  padding: 5px 16px;
  margin-bottom: 22px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 22px;
  font-weight: 900;
  color: #000;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.2;
}
.bottom p {
  margin: 0 0 36px;
  text-transform: uppercase;
  word-break: break-word;
  width: 100%;
}
.cta { width: 100%; display: flex; flex-direction: column; align-items: center; }
.divider { width: 100%; margin-bottom: 22px; }
.swipe {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.75;
  margin-bottom: 20px;
}
</style>
