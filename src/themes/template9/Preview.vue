<script setup>
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import CoverImage from '../shared/CoverImage.vue'
import HeadlineMarkup from '../shared/HeadlineMarkup.vue'

const { post } = storeToRefs(useEditorStore())
</script>

<template>
  <div class="t9">
    <div class="photo">
      <CoverImage
        :src="post.t9.bgImage"
        :pos-x="post.t9.imagePosX"
        :pos-y="post.t9.imagePosY"
        :scale="post.t9.imageScale"
        alt="Background"
      />
    </div>
    <div
      class="fade"
      :style="{
        height: `${post.t9.bottomFadeHeight}%`,
        background: `linear-gradient(to bottom, transparent 0%, ${post.t9.bottomFadeColor} 100%)`,
        opacity: post.t9.bottomFadeOpacity,
      }"
    />
    <div
      v-if="post.t9.showLogo && post.t9.logoUrl"
      class="logo"
      :style="{ top: `${post.t9.logoPosY}%`, left: `${post.t9.logoPosX}%`, width: `${post.t9.logoSize}px` }"
    >
      <CoverImage :src="post.t9.logoUrl" fit="contain" alt="Logo" />
    </div>
    <div class="copy" :style="{ padding: `0 ${post.t9.paddingH}px ${post.t9.paddingBottom}px` }">
      <p :style="{
        fontFamily: `'${post.t9.customFontFamily || post.t9.fontFamily}', sans-serif`,
        fontSize: `${post.t9.fontSize}px`,
        fontWeight: post.t9.fontWeight,
        lineHeight: post.t9.lineHeight,
        letterSpacing: `${post.t9.letterSpacing || 0}em`,
        textAlign: post.t9.textAlign || 'center',
      }">
        <HeadlineMarkup :text="post.t9.headline" :color="post.t9.headlineColor" :highlight="post.t9.highlightColor" />
      </p>
    </div>
  </div>
</template>

<style scoped>
.t9 { position: absolute; inset: 0; background: #000; overflow: hidden; }
.photo { position: absolute; inset: 0; }
.fade { position: absolute; bottom: 0; left: 0; right: 0; pointer-events: none; }
.logo { position: absolute; z-index: 20; }
.logo img,
.logo video { width: 100%; height: auto; display: block; }
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
  text-align: center;
  text-transform: uppercase;
  pointer-events: auto;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
</style>
